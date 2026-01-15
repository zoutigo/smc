"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Prisma, PrismaClient } from "@prisma/client";
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

type PrismaLikeError = { code?: string };
const isPrismaError = (error: unknown): error is PrismaLikeError => typeof error === "object" && error !== null && "code" in error;

const extractString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

type StorageMeanCategoryDelegate = PrismaClient["storageMeanCategory"];
const MODEL_MISSING_WARNING = "Prisma client missing StorageMeanCategory delegate. Run `npx prisma generate` after updating prisma/schema.prisma.";
let storageMeanCategoryDelegateHealthy = true;

const markStorageMeanCategoryDelegateUnhealthy = () => {
  storageMeanCategoryDelegateHealthy = false;
};

const getStorageMeanCategoryDelegate = () => {
  if (!storageMeanCategoryDelegateHealthy) return null;
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
  const categoryDelegate = getStorageMeanCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return listStorageMeanCategoryFallbacks();
  }
  try {
    return await categoryDelegate.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `StorageMeanCategory` does not exist. Return empty list until migration is applied.");
      return listStorageMeanCategoryFallbacks();
    }
    markStorageMeanCategoryDelegateUnhealthy();
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
    const category = await categoryDelegate.findUnique({ where: { id } });
    return category ?? findStorageMeanCategoryFallbackById(id);
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `StorageMeanCategory` does not exist. getStorageMeanCategoryById returning null.");
      return findStorageMeanCategoryFallbackById(id);
    }
    markStorageMeanCategoryDelegateUnhealthy();
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
    const category = await categoryDelegate.findUnique({ where: { slug } });
    return category ?? null;
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `StorageMeanCategory` does not exist. getStorageMeanCategoryBySlug returning null.");
      return null;
    }
    markStorageMeanCategoryDelegateUnhealthy();
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
  const imageUrl = extractString(formData.get("imageUrl"));

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

    let uploadedImageUrl: string | undefined;
    if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
      try {
        const { url } = await persistUploadFile(uploadCandidate);
        uploadedImageUrl = url;
      } catch {
        return { status: "error", message: "Unable to upload image" };
      }
    }

    const createData: Prisma.StorageMeanCategoryCreateInput = {
      name,
      slug,
      description,
      imageUrl: uploadedImageUrl ?? parsed.data.imageUrl ?? null,
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

  const existingImage = extractString(formData.get("existingImageUrl"));
  const removeImage = String(formData.get("removeImage") ?? "false") === "true";
  const imageUrl = extractString(formData.get("imageUrl"));
  const uploadCandidate = formData.get("imageFile");
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

    let nextImageUrl: string | null | undefined = parsedData.imageUrl;
    if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
      try {
        const { url } = await persistUploadFile(uploadCandidate);
        nextImageUrl = url;
        if (existingImage) await deleteUploadFileByUrl(existingImage);
      } catch {
        return { status: "error", message: "Unable to upload image" };
      }
    } else if (removeImage && existingImage) {
      await deleteUploadFileByUrl(existingImage);
      nextImageUrl = null;
    } else if (existingImage && nextImageUrl === undefined) {
      nextImageUrl = existingImage;
    }

    const updatePayload = { ...parsedData } as Record<string, unknown>;
    delete updatePayload.id;
    if (slug) updatePayload.slug = slug;
    if (nextImageUrl === null) {
      updatePayload.imageUrl = null;
    } else if (typeof nextImageUrl === "string") {
      updatePayload.imageUrl = nextImageUrl;
    } else {
      delete updatePayload.imageUrl;
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
    const existing = await categoryDelegate.findUnique({ where: { id } });
    if (!existing) {
      return { status: "error", message: "Storage mean category not found" };
    }

    if (existing.imageUrl) {
      try {
        await deleteUploadFileByUrl(existing.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete storage category image" };
      }
    }

    await categoryDelegate.delete({ where: { id } });
    try { revalidatePath("/storage-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing StorageMeanCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to delete storage mean category" };
  }
}
