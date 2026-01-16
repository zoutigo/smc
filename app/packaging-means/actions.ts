"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Prisma, PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { slugifyValue } from "@/lib/utils";
import { persistUploadFile, deleteUploadFileByUrl } from "@/lib/uploads";
import { createPackagingCategorySchema, updatePackagingCategorySchema, type UpdatePackagingCategoryInput } from "./schema";
import { findPackagingCategoryFallbackById, findPackagingCategoryFallbackBySlug, listPackagingCategoryFallbacks } from "./fallback-data";

export type PackagingCategoryState = {
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

type PackagingCategoryDelegate = PrismaClient["packagingCategory"];
const MODEL_MISSING_WARNING = "Prisma client missing PackagingCategory delegate. Run `npx prisma generate` after updating prisma/schema.prisma.";
let packagingCategoryDelegateHealthy = true;

const markPackagingCategoryDelegateUnhealthy = () => {
  packagingCategoryDelegateHealthy = false;
};

const getPackagingCategoryDelegate = () => {
  if (!packagingCategoryDelegateHealthy) return null;
  const prisma = getPrisma() as PrismaClient & { packagingCategory?: PackagingCategoryDelegate };
  return prisma.packagingCategory ?? null;
};

const buildSlug = (value: string) => {
  const slug = slugifyValue(value);
  return slug.length ? slug : `packaging-${randomUUID().slice(0, 8)}`;
};

const findSlugCollision = async (delegate: PackagingCategoryDelegate, slug: string, excludeId?: string) => {
  return delegate.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
};

export async function getPackagingCategories() {
  const categoryDelegate = getPackagingCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return listPackagingCategoryFallbacks();
  }
  try {
    return await categoryDelegate.findMany({ orderBy: { createdAt: "desc" }, include: { image: true } });
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `PackagingCategory` does not exist. Return empty list until migration is applied.");
      return listPackagingCategoryFallbacks();
    }
    markPackagingCategoryDelegateUnhealthy();
    console.warn("Unable to fetch packaging categories. Returning fallback data instead.", error);
    return listPackagingCategoryFallbacks();
  }
}

export async function getPackagingCategoryById(id: string) {
  const categoryDelegate = getPackagingCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return findPackagingCategoryFallbackById(id);
  }
  try {
    const category = await categoryDelegate.findUnique({ where: { id }, include: { image: true } });
    return category ?? findPackagingCategoryFallbackById(id);
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `PackagingCategory` does not exist. getPackagingCategoryById returning null.");
      return findPackagingCategoryFallbackById(id);
    }
    markPackagingCategoryDelegateUnhealthy();
    console.warn("Unable to fetch packaging category by id. Returning fallback data instead.", error);
    return findPackagingCategoryFallbackById(id);
  }
}

export async function getPackagingCategoryBySlug(slug: string) {
  const fallbackCategory = findPackagingCategoryFallbackBySlug(slug);
  if (fallbackCategory) return fallbackCategory;

  const categoryDelegate = getPackagingCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return null;
  }
  try {
    const category = await categoryDelegate.findUnique({ where: { slug }, include: { image: true } });
    return category ?? null;
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `PackagingCategory` does not exist. getPackagingCategoryBySlug returning null.");
      return null;
    }
    markPackagingCategoryDelegateUnhealthy();
    console.warn("Unable to fetch packaging category by slug. Returning fallback data instead.", error);
    return fallbackCategory;
  }
}

export async function createPackagingCategoryAction(_: PackagingCategoryState, formData: FormData): Promise<PackagingCategoryState> {
  const baseFields = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
  };

  const uploadCandidate = formData.get("imageFile");
  let imageUrl = extractString(formData.get("imageUrl"));

  const parsed = createPackagingCategorySchema.safeParse({ ...baseFields, imageUrl });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    });
    return { status: "error", fieldErrors };
  }

  const categoryDelegate = getPackagingCategoryDelegate();
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

    if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
      try {
        const { url } = await persistUploadFile(uploadCandidate);
        imageUrl = url;
      } catch {
        return { status: "error", message: "Unable to upload image" };
      }
    }

    const createData: Prisma.PackagingCategoryCreateInput = {
      name,
      slug,
      description,
      ...(imageUrl ? { image: { create: { imageUrl } } } : {}),
    };

    await categoryDelegate.create({ data: createData });
    try { revalidatePath("/packaging-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing PackagingCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to create packaging category" };
  }
}

export async function updatePackagingCategoryAction(_: PackagingCategoryState, id: string, formData: FormData): Promise<PackagingCategoryState> {
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

  const parsed = updatePackagingCategorySchema.safeParse(schemaInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    });
    return { status: "error", fieldErrors };
  }

  const categoryDelegate = getPackagingCategoryDelegate();
  if (!categoryDelegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  const parsedData = parsed.data as UpdatePackagingCategoryInput;
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

    const existing = await categoryDelegate.findUnique({ where: { id }, include: { image: true } });
    if (!existing) {
      return { status: "error", message: "Packaging category not found" };
    }

    const currentImage = existing.image;
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
        return { status: "error", message: "Unable to delete category image" };
      }
      nextImageUrl = null;
    } else if (currentImage?.imageUrl && nextImageUrl === undefined) {
      nextImageUrl = currentImage.imageUrl;
    }

    const updatePayload = { ...parsedData } as Record<string, unknown>;
    delete updatePayload.id;
    if (slug) updatePayload.slug = slug;
    delete updatePayload.imageUrl;

    if (removeImage && currentImage) {
      updatePayload.image = { delete: true };
    } else if (typeof nextImageUrl === "string" && nextImageUrl.length > 0) {
      updatePayload.image = currentImage
        ? { update: { imageUrl: nextImageUrl } }
        : { create: { imageUrl: nextImageUrl } };
    }

    await categoryDelegate.update({ where: { id }, data: updatePayload });
    try { revalidatePath("/packaging-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing PackagingCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to update packaging category" };
  }
}

export async function deletePackagingCategoryAction(_: PackagingCategoryState, id: string): Promise<PackagingCategoryState> {
  const categoryDelegate = getPackagingCategoryDelegate();
  if (!categoryDelegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  try {
    const existing = await categoryDelegate.findUnique({ where: { id }, include: { image: true } });
    if (!existing) {
      return { status: "error", message: "Packaging category not found" };
    }

    if (existing.image?.imageUrl) {
      try {
        await deleteUploadFileByUrl(existing.image.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete category image" };
      }
    }

    await categoryDelegate.update({ where: { id }, data: { image: existing.image ? { delete: true } : undefined } });
    await categoryDelegate.delete({ where: { id } });
    try { revalidatePath("/packaging-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing PackagingCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to delete packaging category" };
  }
}
