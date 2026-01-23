"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { NoteTargetType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { slugifyValue } from "@/lib/utils";
import { persistUploadFile } from "@/lib/uploads";
import { baseTransportMeanSchema } from "../_registry/base-transport-mean-schema";
import { resolveTransportMeanSlug } from "../_registry/transportMean.registry";

export type TransportMeanActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
};

export type NoteActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  note?: { id: string; title?: string | null; content: string; createdAt: string };
};

const payloadSchema = baseTransportMeanSchema.extend({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  packagingLinks: z
    .array(
      z.object({
        packagingMeanId: z.string().uuid(),
        maxQty: z.coerce.number().int().min(1),
      })
    )
    .default([]),
  images: z.array(z.any()).optional(),
});

const noteSchema = z.object({
  transportMeanId: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
});

const extractString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const parsePackagingLinks = (formData: FormData) => {
  try {
    const raw = formData.get("packagingLinks");
    if (!raw) return [];
    return JSON.parse(String(raw)) as Array<{ packagingMeanId: string; maxQty: number }>;
  } catch {
    return [];
  }
};

const extractImageFiles = (formData: FormData) => {
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("imageFile_") && value instanceof File && value.size > 0) {
      files.push(value);
    }
  }
  return files;
};

const parseFlowIds = (formData: FormData) => {
  try {
    const raw = formData.get("flowIds");
    if (!raw) return [];
    return JSON.parse(String(raw)) as string[];
  } catch {
    return [];
  }
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

export async function createTransportMeanNoteAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const payload = {
    transportMeanId: extractString(formData.get("transportMeanId")),
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
    const noteTargetType = (NoteTargetType?.TRANSPORT_MEAN ?? "TRANSPORT_MEAN") as NoteTargetType;
    const note = await prisma.note.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content!,
      },
    });

    await prisma.noteLink.create({
      data: {
        noteId: note.id,
        targetId: parsed.data.transportMeanId!,
        targetType: noteTargetType,
      },
    });

    try {
      revalidatePath("/transport-means");
      if (parsed.data.slug) {
        revalidatePath(`/transport-means/${parsed.data.slug}`);
      }
      if (parsed.data.slug && parsed.data.transportMeanId) {
        revalidatePath(`/transport-means/${parsed.data.slug}/${parsed.data.transportMeanId}`);
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

export async function createTransportMeanAction(_: TransportMeanActionState, formData: FormData): Promise<TransportMeanActionState> {
  const payload = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    transportMeanCategoryId: extractString(formData.get("transportMeanCategoryId")),
    supplierId: extractString(formData.get("supplierId")),
    plantId: extractString(formData.get("plantId")),
    flowIds: parseFlowIds(formData),
    units: extractString(formData.get("units")),
    loadCapacityKg: extractString(formData.get("loadCapacityKg")),
    cruiseSpeedKmh: extractString(formData.get("cruiseSpeedKmh")),
    maxSpeedKmh: extractString(formData.get("maxSpeedKmh")),
    sop: extractString(formData.get("sop")),
    eop: extractString(formData.get("eop")),
    packagingLinks: parsePackagingLinks(formData),
    slug: extractString(formData.get("slug")),
  };

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error.issues) };
  }

  const prisma = getPrisma() as PrismaClient & { transportMean?: PrismaClient["transportMean"]; transportMeanPackagingMean?: PrismaClient["transportMeanPackagingMean"]; transportMeanFlow?: PrismaClient["transportMeanFlow"]; image?: PrismaClient["image"]; transportMeanImage?: PrismaClient["transportMeanImage"] };
  if (!("transportMean" in prisma)) {
    return { status: "error", message: "TransportMean delegate missing. Run prisma generate." };
  }

  try {
    const slug = resolveTransportMeanSlug(parsed.data.slug) ?? slugifyValue(parsed.data.name) ?? `transport-${Date.now()}`;
    const created = await prisma.transportMean.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        slug,
        transportMeanCategoryId: parsed.data.transportMeanCategoryId,
        supplierId: parsed.data.supplierId ?? null,
        plantId: parsed.data.plantId,
        units: parsed.data.units,
        loadCapacityKg: parsed.data.loadCapacityKg,
        cruiseSpeedKmh: parsed.data.cruiseSpeedKmh,
        maxSpeedKmh: parsed.data.maxSpeedKmh,
        sop: parsed.data.sop ? new Date(parsed.data.sop) : undefined,
        eop: parsed.data.eop ? new Date(parsed.data.eop) : undefined,
      },
    });

    const uploadFiles = extractImageFiles(formData);
    if (uploadFiles.length && "image" in prisma && "transportMeanImage" in prisma) {
      let idx = 0;
      for (const file of uploadFiles) {
        const { url } = await persistUploadFile(file);
        const image = await prisma.image.create({ data: { imageUrl: url } });
        await prisma.transportMeanImage.create({
          data: {
            transportMeanId: created.id,
            imageId: image.id,
            sortOrder: idx,
          },
        });
        idx += 1;
      }
    }

    if (parsed.data.packagingLinks?.length && "transportMeanPackagingMean" in prisma) {
      for (const link of parsed.data.packagingLinks) {
        await prisma.transportMeanPackagingMean.create({
          data: {
            transportMeanId: created.id,
            packagingMeanId: link.packagingMeanId,
            maxQty: link.maxQty,
          },
        });
      }
    }

    if (parsed.data.flowIds?.length && "transportMeanFlow" in prisma) {
      for (const flowId of parsed.data.flowIds) {
        await prisma.transportMeanFlow.create({
          data: {
            transportMeanId: created.id,
            flowId,
          },
        });
      }
    }

    try {
      revalidatePath("/transport-means");
      const resolvedSlug = resolveTransportMeanSlug(parsed.data.slug) ?? slug;
      if (resolvedSlug) revalidatePath(`/transport-means/${resolvedSlug}`);
      revalidatePath(`/transport-means/${resolvedSlug}/${created.id}`);
    } catch {}

    return { status: "success", id: created.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create transport mean";
    return { status: "error", message };
  }
}

export async function updateTransportMeanAction(_: TransportMeanActionState, id: string, formData: FormData): Promise<TransportMeanActionState> {
  const payload = {
    id,
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    transportMeanCategoryId: extractString(formData.get("transportMeanCategoryId")),
    supplierId: extractString(formData.get("supplierId")),
    plantId: extractString(formData.get("plantId")),
    flowIds: parseFlowIds(formData),
    units: extractString(formData.get("units")),
    loadCapacityKg: extractString(formData.get("loadCapacityKg")),
    cruiseSpeedKmh: extractString(formData.get("cruiseSpeedKmh")),
    maxSpeedKmh: extractString(formData.get("maxSpeedKmh")),
    sop: extractString(formData.get("sop")),
    eop: extractString(formData.get("eop")),
    packagingLinks: parsePackagingLinks(formData),
    slug: extractString(formData.get("slug")),
  };

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error.issues) };
  }

  const removeImageIdsRaw = extractString(formData.get("removeImageIds"));
  const removeImageIds: string[] = removeImageIdsRaw ? JSON.parse(removeImageIdsRaw) : [];

  const prisma = getPrisma() as PrismaClient & { transportMean?: PrismaClient["transportMean"]; transportMeanPackagingMean?: PrismaClient["transportMeanPackagingMean"]; transportMeanFlow?: PrismaClient["transportMeanFlow"]; image?: PrismaClient["image"]; transportMeanImage?: PrismaClient["transportMeanImage"] };
  if (!("transportMean" in prisma)) {
    return { status: "error", message: "TransportMean delegate missing. Run prisma generate." };
  }

  try {
    const slug = resolveTransportMeanSlug(parsed.data.slug) ?? slugifyValue(parsed.data.name) ?? `transport-${Date.now()}`;
    const updated = await prisma.transportMean.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        slug,
        transportMeanCategoryId: parsed.data.transportMeanCategoryId,
        supplierId: parsed.data.supplierId ?? null,
        plantId: parsed.data.plantId,
        units: parsed.data.units,
        loadCapacityKg: parsed.data.loadCapacityKg,
        cruiseSpeedKmh: parsed.data.cruiseSpeedKmh,
        maxSpeedKmh: parsed.data.maxSpeedKmh,
        sop: parsed.data.sop ? new Date(parsed.data.sop) : undefined,
        eop: parsed.data.eop ? new Date(parsed.data.eop) : undefined,
      },
    });

    if (removeImageIds.length && "transportMeanImage" in prisma && "image" in prisma) {
      await prisma.transportMeanImage.deleteMany({ where: { transportMeanId: id, imageId: { in: removeImageIds } } });
      await prisma.image.deleteMany({ where: { id: { in: removeImageIds } } });
    }

    const uploadFiles = extractImageFiles(formData);
    if (uploadFiles.length && "image" in prisma && "transportMeanImage" in prisma) {
      let idx = 0;
      for (const file of uploadFiles) {
        const { url } = await persistUploadFile(file);
        const image = await prisma.image.create({ data: { imageUrl: url } });
        await prisma.transportMeanImage.create({
          data: {
            transportMeanId: id,
            imageId: image.id,
            sortOrder: idx,
          },
        });
        idx += 1;
      }
    }

    if ("transportMeanPackagingMean" in prisma) {
      await prisma.transportMeanPackagingMean.deleteMany({ where: { transportMeanId: id } });
      if (parsed.data.packagingLinks?.length) {
        for (const link of parsed.data.packagingLinks) {
          await prisma.transportMeanPackagingMean.create({
            data: {
              transportMeanId: id,
              packagingMeanId: link.packagingMeanId,
              maxQty: link.maxQty,
            },
          });
        }
      }
    }

    if ("transportMeanFlow" in prisma) {
      await prisma.transportMeanFlow.deleteMany({ where: { transportMeanId: id } });
      if (parsed.data.flowIds?.length) {
        for (const flowId of parsed.data.flowIds) {
          await prisma.transportMeanFlow.create({
            data: {
              transportMeanId: id,
              flowId,
            },
          });
        }
      }
    }

    try {
      revalidatePath("/transport-means");
      const resolvedSlug = resolveTransportMeanSlug(parsed.data.slug) ?? slug;
      if (resolvedSlug) revalidatePath(`/transport-means/${resolvedSlug}`);
      revalidatePath(`/transport-means/${resolvedSlug}/${updated.id}`);
    } catch {}

    return { status: "success", id: updated.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to update transport mean";
    return { status: "error", message };
  }
}
