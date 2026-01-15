"use server";

import { revalidatePath } from "next/cache";
import type { Prisma, PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { persistUploadFile, deleteUploadFileByUrl } from "@/lib/uploads";
import { createPackagingCategorySchema, updatePackagingCategorySchema, type UpdatePackagingCategoryInput } from "./schema";

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

type PackagingCategoryDelegate = PrismaClient["plant"];
const MODEL_MISSING_WARNING = "Prisma client missing PackagingCategory delegate. Run `npx prisma generate` after updating prisma/schema.prisma.";

const getPackagingCategoryDelegate = () => {
  const prisma = getPrisma() as PrismaClient & { packagingCategory?: PackagingCategoryDelegate };
  return prisma.packagingCategory ?? null;
};

export async function getPackagingCategories() {
  const categoryDelegate = getPackagingCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return [];
  }
  try {
    return await categoryDelegate.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `PackagingCategory` does not exist. Return empty list until migration is applied.");
      return [];
    }
    throw error;
  }
}

export async function getPackagingCategoryById(id: string) {
  const categoryDelegate = getPackagingCategoryDelegate();
  if (!categoryDelegate) {
    console.warn(MODEL_MISSING_WARNING);
    return null;
  }
  try {
    return await categoryDelegate.findUnique({ where: { id } });
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `PackagingCategory` does not exist. getPackagingCategoryById returning null.");
      return null;
    }
    throw error;
  }
}

export async function createPackagingCategoryAction(_: PackagingCategoryState, formData: FormData): Promise<PackagingCategoryState> {
  const baseFields = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
  };

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

  try {
    const existing = await categoryDelegate.findFirst({ where: { name } });
    if (existing) {
      return { status: "error", fieldErrors: { name: "A category with this name already exists" } };
    }

    const createData: Prisma.PackagingCategoryCreateInput = {
      name,
      description,
      imageUrl: parsed.data.imageUrl ?? null,
    };

    await categoryDelegate.create({ data: createData });
    try { revalidatePath("/packaging-categories"); } catch {}
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

  const existingImage = extractString(formData.get("existingImageUrl"));
  const removeImage = String(formData.get("removeImage") ?? "false") === "true";
  let imageUrl = extractString(formData.get("imageUrl"));

  const uploadCandidate = formData.get("imageFile");
  if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
    try {
      const { url } = await persistUploadFile(uploadCandidate);
      imageUrl = url;
      if (existingImage) await deleteUploadFileByUrl(existingImage);
    } catch {
      return { status: "error", message: "Unable to upload image" };
    }
  } else if (removeImage && existingImage) {
    await deleteUploadFileByUrl(existingImage);
    imageUrl = undefined;
  } else if (existingImage && !imageUrl) {
    imageUrl = existingImage;
  }

  const parsed = updatePackagingCategorySchema.safeParse({ id, ...baseFields, imageUrl });
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
  const { name } = parsed.data as UpdatePackagingCategoryInput;

  try {
    if (name) {
      const existing = await categoryDelegate.findFirst({ where: { name, NOT: { id } } });
      if (existing) {
        return { status: "error", fieldErrors: { name: "A category with this name already exists" } };
      }
    }

    const updatePayload = { ...parsed.data } as Record<string, unknown>;
    if (typeof updatePayload.imageUrl === "string" && updatePayload.imageUrl.trim() === "") {
      delete updatePayload.imageUrl;
    }
    if (updatePayload.imageUrl === undefined) delete updatePayload.imageUrl;

    await categoryDelegate.update({ where: { id }, data: updatePayload });
    try { revalidatePath("/packaging-categories"); } catch {}
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
    await categoryDelegate.delete({ where: { id } });
    try { revalidatePath("/packaging-categories"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing PackagingCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to delete packaging category" };
  }
}
