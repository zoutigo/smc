"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Prisma, PrismaClient, TransportMean, TransportMeanCategory } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { slugifyValue } from "@/lib/utils";
import { deleteUploadFileByUrl, persistUploadFile } from "@/lib/uploads";
import { createTransportMeanCategorySchema, updateTransportMeanCategorySchema, type UpdateTransportMeanCategoryInput } from "./schema";

const SKIP_DB = process.env.SKIP_DB_ON_BUILD === "1" && process.env.NEXT_PHASE === "phase-production-build";

export type TransportMeanCategoryState = {
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

type TransportMeanCategoryDelegate = PrismaClient["transportMeanCategory"];
const MODEL_MISSING_WARNING = "Prisma client missing TransportMeanCategory delegate. Run `npx prisma generate` after updating prisma/schema.prisma.";

const getTransportMeanCategoryDelegate = () => {
  const prisma = getPrisma() as PrismaClient & { transportMeanCategory?: TransportMeanCategoryDelegate };
  return prisma.transportMeanCategory ?? null;
};

const buildSlug = (value: string) => {
  const slug = slugifyValue(value);
  return slug.length ? slug : `transport-${randomUUID().slice(0, 8)}`;
};

const findSlugCollision = async (delegate: TransportMeanCategoryDelegate, slug: string, excludeId?: string) => {
  return delegate.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
};

export async function getTransportMeanCategories(): Promise<Array<TransportMeanCategory & { image: Prisma.ImageUncheckedCreateInput | null }>> {
  if (SKIP_DB) return [];
  const delegate = getTransportMeanCategoryDelegate();
  if (!delegate) return [];
  try {
    const categories = await delegate.findMany({
      orderBy: { name: "asc" },
      include: { image: { include: { image: true } } },
    });
    return categories.map((c) => ({ ...c, image: c.image?.image ?? null }));
  } catch (error) {
    console.warn("getTransportMeanCategories failed", error);
    return [];
  }
}

export async function getTransportMeanCategoryBySlug(slug: string): Promise<TransportMeanCategory | null> {
  const prisma = getPrisma() as PrismaClient & { transportMeanCategory?: PrismaClient["transportMeanCategory"] };
  if (!("transportMeanCategory" in prisma)) return null;
  try {
    return await prisma.transportMeanCategory.findUnique({
      where: { slug },
      include: { image: { include: { image: true } } },
    });
  } catch (error) {
    console.warn("getTransportMeanCategoryBySlug failed", error);
    return null;
  }
}

export async function createTransportMeanCategoryAction(_: TransportMeanCategoryState, formData: FormData): Promise<TransportMeanCategoryState> {
  const baseFields = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
  };

  const uploadCandidate = formData.get("imageFile");
  let imageUrl = extractString(formData.get("imageUrl"));

  const parsed = createTransportMeanCategorySchema.safeParse({ ...baseFields, imageUrl });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    });
    return { status: "error", fieldErrors };
  }

  const delegate = getTransportMeanCategoryDelegate();
  if (!delegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  const { name, description } = parsed.data;
  const slug = buildSlug(name);

  try {
    const existing = await findSlugCollision(delegate, slug);
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

    const createData: Prisma.TransportMeanCategoryCreateInput = {
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

    await delegate.create({ data: createData });
    try { revalidatePath("/transport-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing TransportMeanCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to create transport category" };
  }
}

export async function updateTransportMeanCategoryAction(_: TransportMeanCategoryState, id: string, formData: FormData): Promise<TransportMeanCategoryState> {
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

  const parsed = updateTransportMeanCategorySchema.safeParse(schemaInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    });
    return { status: "error", fieldErrors };
  }

  const delegate = getTransportMeanCategoryDelegate();
  if (!delegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  const parsedData = parsed.data as UpdateTransportMeanCategoryInput;
  const { name } = parsedData;

  try {
    let slug: string | undefined;
    if (name) {
      slug = buildSlug(name);
      const existing = await findSlugCollision(delegate, slug, id);
      if (existing) {
        return { status: "error", fieldErrors: { name: "A category with this name already exists" } };
      }
    }

    const existing = await delegate.findUnique({
      where: { id },
      include: { image: { include: { image: true } } },
    });
    if (!existing) {
      return { status: "error", message: "Transport category not found" };
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
        nextImageUrl = null;
      } catch {
        return { status: "error", message: "Unable to delete category image" };
      }
    }

    await delegate.update({
      where: { id },
      data: {
        ...(parsedData.name ? { name: parsedData.name } : {}),
        ...(slug ? { slug } : {}),
        ...(parsedData.description ? { description: parsedData.description } : {}),
        ...(removeImage ? { image: { delete: true } } : nextImageUrl ? { image: { upsert: { update: { image: { update: { imageUrl: nextImageUrl } } }, create: { image: { create: { imageUrl: nextImageUrl } } } } } } : {}),
      },
    });
    try { revalidatePath("/transport-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing TransportMeanCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to update transport category" };
  }
}

export async function deleteTransportMeanCategoryAction(_: TransportMeanCategoryState, id: string): Promise<TransportMeanCategoryState> {
  const delegate = getTransportMeanCategoryDelegate();
  if (!delegate) {
    return { status: "error", message: MODEL_MISSING_WARNING };
  }
  try {
    const existing = await delegate.findUnique({ where: { id }, include: { image: { include: { image: true } } } });
    if (!existing) {
      return { status: "error", message: "Transport category not found" };
    }

    if (existing.image?.image?.imageUrl) {
      try {
        await deleteUploadFileByUrl(existing.image.image.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete category image" };
      }
    }

    await delegate.update({ where: { id }, data: { image: existing.image ? { delete: true } : undefined } });
    await delegate.delete({ where: { id } });
    try { revalidatePath("/transport-means"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing TransportMeanCategory table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to delete transport category" };
  }
}

export async function getTransportMeansByCategorySlug(
  slug: string,
  filters?: { plantId?: string; flowId?: string }
): Promise<TransportMean[]> {
  const prisma = getPrisma() as PrismaClient & { transportMean?: PrismaClient["transportMean"] };
  if (!("transportMean" in prisma)) return [];
  try {
    return await prisma.transportMean.findMany({
      where: {
        transportMeanCategory: { slug },
        ...(filters?.plantId ? { plantId: filters.plantId } : {}),
        ...(filters?.flowId ? { flows: { some: { flowId: filters.flowId } } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: { supplier: true, transportMeanCategory: true, plant: true, flows: { include: { flow: true } } },
    });
  } catch (error) {
    console.warn("getTransportMeansByCategorySlug failed", error);
    return [];
  }
}

export async function getTransportMeanById(id: string): Promise<TransportMean | null> {
  const prisma = getPrisma() as PrismaClient & { transportMean?: PrismaClient["transportMean"] };
  if (!("transportMean" in prisma)) return null;
  try {
    return await prisma.transportMean.findUnique({
      where: { id },
      include: {
        transportMeanCategory: true,
        supplier: true,
        plant: true,
        flows: { include: { flow: true } },
        images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
        packagingLinks: {
          include: { packagingMean: true },
        },
      },
    });
  } catch (error) {
    console.warn("getTransportMeanById failed", error);
    return null;
  }
}
