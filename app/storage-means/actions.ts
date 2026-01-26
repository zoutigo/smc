"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@prisma/client";
import { NoteTargetType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { slugifyValue } from "@/lib/utils";
import { persistUploadFile, deleteUploadFileByUrl } from "@/lib/uploads";
import { createStorageMeanCategorySchema, updateStorageMeanCategorySchema, type UpdateStorageMeanCategoryInput } from "./schema";
import { findStorageMeanCategoryFallbackById, findStorageMeanCategoryFallbackBySlug, listStorageMeanCategoryFallbacks } from "./fallback-data";

export type StorageMeanCategoryState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type NoteActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  note?: { id: string; title?: string | null; content: string; createdAt: string };
};

type PrismaLikeError = { code?: string };
const isPrismaError = (error: unknown): error is PrismaLikeError => typeof error === "object" && error !== null && "code" in error;

const SKIP_DB = process.env.SKIP_DB_ON_BUILD === "1" && process.env.NEXT_PHASE === "phase-production-build";

const extractString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const mapFieldErrors = (issues: z.ZodIssue[]) => {
  const errors: Record<string, string> = {};
  issues.forEach((issue) => {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  });
  return errors;
};

type StorageMeanCategoryDelegate = PrismaClient["storageMeanCategory"];
const MODEL_MISSING_WARNING = "Prisma client missing StorageMeanCategory delegate. Run `npx prisma generate` after updating prisma/schema.prisma.";

const getStorageMeanCategoryDelegate = () => {
  const prisma = getPrisma() as PrismaClient & { storageMeanCategory?: StorageMeanCategoryDelegate };
  return prisma.storageMeanCategory ?? null;
};

const buildSlug = (value: string) => {
  const slug = slugifyValue(value);
  return slug.length ? slug : `storage-${randomUUID().slice(0, 8)}`;
};

const findSlugCollision = async (delegate: StorageMeanCategoryDelegate, slug: string, excludeId?: string) => {
  return delegate.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
};

export async function getStorageMeanCategories() {
  if (SKIP_DB) return listStorageMeanCategoryFallbacks();
  const categoryDelegate = getStorageMeanCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return listStorageMeanCategoryFallbacks();
  }
  try {
    const categories = await categoryDelegate.findMany({
      orderBy: { createdAt: "desc" },
      include: { image: { include: { image: true } } },
    });
    return categories.map((category) => ({
      ...category,
      image: category.image?.image ?? null,
    }));
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `StorageMeanCategory` does not exist. Return empty list until migration is applied.");
      return listStorageMeanCategoryFallbacks();
    }
    console.warn("Unable to fetch storage mean categories. Returning fallback data instead.", error);
    return listStorageMeanCategoryFallbacks();
  }
}

export async function getStorageMeanCategoryById(id: string) {
  const categoryDelegate = getStorageMeanCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return findStorageMeanCategoryFallbackById(id);
  }
  try {
    const category = await categoryDelegate.findUnique({
      where: { id },
      include: { image: { include: { image: true } } },
    });
    const flattened = category ? { ...category, image: category.image?.image ?? null } : null;
    return flattened ?? findStorageMeanCategoryFallbackById(id);
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `StorageMeanCategory` does not exist. getStorageMeanCategoryById returning null.");
      return findStorageMeanCategoryFallbackById(id);
    }
    console.warn("Unable to fetch storage mean category by id. Returning fallback data instead.", error);
    return findStorageMeanCategoryFallbackById(id);
  }
}

export async function getStorageMeanCategoryBySlug(slug: string) {
  // Short-circuit if slug exists in fallbacks to avoid prisma calls when unnecessary or flaky.
  const fallbackCategory = findStorageMeanCategoryFallbackBySlug(slug);
  if (fallbackCategory) return fallbackCategory;

  const categoryDelegate = getStorageMeanCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return null;
  }
  try {
    const category = await categoryDelegate.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } },
    });
    return category ? { ...category, image: category.image?.image ?? null } : null;
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `StorageMeanCategory` does not exist. getStorageMeanCategoryBySlug returning null.");
      return null;
    }
    console.warn("Unable to fetch storage mean category by slug. Returning fallback data instead.", error);
    return fallbackCategory;
  }
}

export async function createStorageMeanCategoryAction(_: StorageMeanCategoryState, formData: FormData): Promise<StorageMeanCategoryState> {
  const baseFields = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
  };

  const uploadCandidate = formData.get("imageFile");
  let imageUrl = extractString(formData.get("imageUrl"));

  if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
    try {
      const { url } = await persistUploadFile(uploadCandidate);
      imageUrl = url;
    } catch {
      return { status: "error", message: "Unable to upload image" };
    }
  }

  const parsed = createStorageMeanCategorySchema.safeParse({ ...baseFields, imageUrl });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    });
    return { status: "error", fieldErrors };
  }

  const categoryDelegate = getStorageMeanCategoryDelegate();
  if (!categoryDelegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  const { name, description } = parsed.data;
  const slug = buildSlug(name);

  try {
    const existing = await findSlugCollision(categoryDelegate, slug);
    if (existing) {
      return { status: "error", fieldErrors: { name: "A category with this name already exists" } };
    }

    const createData: Prisma.StorageMeanCategoryCreateInput = {
      name,
      slug,
      description,
      ...(imageUrl
        ? {
            image: {
              create: {
                image: {
                  create: { imageUrl },
                },
              },
            },
          }
        : {}),
    };

    await categoryDelegate.create({ data: createData });
    try { revalidatePath("/storage-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing StorageMeanCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to create storage mean category" };
  }
}

export async function updateStorageMeanCategoryAction(_: StorageMeanCategoryState, id: string, formData: FormData): Promise<StorageMeanCategoryState> {
  const baseFields = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
  };

  const removeImage = String(formData.get("removeImage") ?? "false") === "true";
  let imageUrl = extractString(formData.get("imageUrl"));
  const uploadCandidate = formData.get("imageFile");
  if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
    try {
      const { url } = await persistUploadFile(uploadCandidate);
      imageUrl = url;
    } catch {
      return { status: "error", message: "Unable to upload image" };
    }
  }

  const schemaInput: Record<string, unknown> = { id, ...baseFields };
  if (imageUrl) schemaInput.imageUrl = imageUrl;

  const parsed = updateStorageMeanCategorySchema.safeParse(schemaInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    });
    return { status: "error", fieldErrors };
  }

  const categoryDelegate = getStorageMeanCategoryDelegate();
  if (!categoryDelegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  const parsedData = parsed.data as UpdateStorageMeanCategoryInput;
  const { name } = parsedData;

  try {
    let slug: string | undefined;
    if (name) {
      slug = buildSlug(name);
      const existing = await findSlugCollision(categoryDelegate, slug, id);
      if (existing) {
        return { status: "error", fieldErrors: { name: "A category with this name already exists" } };
      }
    }

    const existing = await categoryDelegate.findUnique({
      where: { id },
      include: { image: { include: { image: true } } },
    });
    if (!existing) {
      return { status: "error", message: "Storage mean category not found" };
    }

    const currentImage = existing.image?.image;
    let nextImageUrl: string | null | undefined = imageUrl ?? parsedData.imageUrl;

    if (uploadCandidate instanceof File && uploadCandidate.size > 0 && currentImage?.imageUrl && currentImage.imageUrl !== nextImageUrl) {
      try {
        await deleteUploadFileByUrl(currentImage.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete previous image" };
      }
    } else if (removeImage && currentImage?.imageUrl) {
      try {
        await deleteUploadFileByUrl(currentImage.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete storage category image" };
      }
      nextImageUrl = null;
    } else if (currentImage?.imageUrl && nextImageUrl === undefined) {
      nextImageUrl = currentImage.imageUrl;
    }

    const updatePayload = { ...parsedData } as Record<string, unknown>;
    delete updatePayload.id;
    if (slug) updatePayload.slug = slug;
    delete updatePayload.imageUrl;

    if (removeImage && existing.image) {
      updatePayload.image = { delete: true };
    } else if (typeof nextImageUrl === "string" && nextImageUrl.length > 0) {
      updatePayload.image = existing.image
        ? { update: { image: { update: { imageUrl: nextImageUrl } } } }
        : { create: { image: { create: { imageUrl: nextImageUrl } } } };
    }

    await categoryDelegate.update({ where: { id }, data: updatePayload });
    try { revalidatePath("/storage-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing StorageMeanCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to update storage mean category" };
  }
}

export async function deleteStorageMeanCategoryAction(_: StorageMeanCategoryState, id: string): Promise<StorageMeanCategoryState> {
  const categoryDelegate = getStorageMeanCategoryDelegate();
  if (!categoryDelegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  try {
    const existing = await categoryDelegate.findUnique({ where: { id }, include: { image: { include: { image: true } } } });
    if (!existing) {
      return { status: "error", message: "Storage mean category not found" };
    }

    if (existing.image?.image?.imageUrl) {
      try {
        await deleteUploadFileByUrl(existing.image.image.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete storage category image" };
      }
    }

    await categoryDelegate.update({ where: { id }, data: { image: existing.image ? { delete: true } : undefined } });
    await categoryDelegate.delete({ where: { id } });
    try { revalidatePath("/storage-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error)) {
      if (error.code === "P2021") {
        return { status: "error", message: "Database schema not applied (missing StorageMeanCategory table). Run Prisma migrations." };
      }
      if (error.code === "P2003") {
        return { status: "error", message: "Cannot delete: this category is still linked to storage means. Reassign or remove them first." };
      }
    }
    return { status: "error", message: "Unable to delete storage mean category" };
  }
}

const noteSchema = z.object({
  storageMeanId: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
});

export async function createStorageMeanNoteAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const payload = {
    storageMeanId: extractString(formData.get("storageMeanId")),
    content: extractString(formData.get("content")),
    title: extractString(formData.get("title")),
    slug: extractString(formData.get("slug")),
  };

  const parsed = noteSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error.issues) };
  }

  const prisma = getPrisma() as PrismaClient;
  try {
    const noteTargetType = (NoteTargetType?.STORAGE_MEAN ?? "STORAGE_MEAN") as NoteTargetType;
    const note = await prisma.note.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content!,
      },
    });

    await prisma.noteLink.create({
      data: {
        noteId: note.id,
        targetId: parsed.data.storageMeanId!,
        targetType: noteTargetType,
      },
    });

    try {
      revalidatePath("/storage-means");
      if (parsed.data.slug) {
        revalidatePath(`/storage-means/${parsed.data.slug}`);
        revalidatePath(`/storage-means/${parsed.data.slug}/${parsed.data.storageMeanId}`);
      }
    } catch {}

    return {
      status: "success",
      note: { id: note.id, title: note.title, content: note.content, createdAt: note.createdAt.toISOString() },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to add note";
    return { status: "error", message };
  }
}
