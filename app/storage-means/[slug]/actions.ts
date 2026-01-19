"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ZodIssue } from "zod";
import { PrismaClient, StorageStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { persistUploadFile } from "@/lib/uploads";

export type StorageMeanActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const storageMeanSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().int().min(0, "Price must be a positive integer"),
  status: z.nativeEnum(StorageStatus).default(StorageStatus.DRAFT),
  plantId: z.string().uuid({ message: "Plant is required" }),
  flowId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional(),
  plcType: z.string().min(2).optional(),
});

const laneSchema = z.object({
  length: z.number().int().min(1),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  quantity: z.number().int().min(1),
});
const lanesSchema = z.array(laneSchema).min(1);

const parseLanes = (lanesRaw: string | undefined): ReturnType<typeof lanesSchema.safeParse> => {
  try {
    const parsedJson = lanesRaw ? JSON.parse(lanesRaw) : [];
    return lanesSchema.safeParse(parsedJson);
  } catch {
    const issue: ZodIssue = { code: "custom", message: "Invalid lanes", path: [] };
    return {
      success: false as const,
      error: new z.ZodError([issue]),
    } as ReturnType<typeof lanesSchema.safeParse>;
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

async function syncLanesForCategory(params: {
  categorySlug: string;
  storageMeanId: string;
  lanes: Array<{ length: number; width: number; height: number; quantity: number }>;
  plcType?: string;
  prisma: PrismaClient;
}) {
  const { categorySlug, storageMeanId, lanes, prisma, plcType } = params;
  const isManual = categorySlug === "manual-transtocker";
  const isAuto = categorySlug === "auto-transtocker";
  if (!isManual && !isAuto) return;
  if (!lanes.length) return;

  const ensureLane = (lane: { length: number; width: number; height: number }) =>
    prisma.lane.upsert({
      where: { length_width_height: { length: lane.length, width: lane.width, height: lane.height } },
      update: {},
      create: { length: lane.length, width: lane.width, height: lane.height },
    });

  if (isManual) {
    await prisma.storageMeanManualTranstocker.upsert({
      where: { storageMeanId },
      create: { storageMeanId, emptyReturnLanes: 0 },
      update: {},
    });
    await prisma.storageMeanManualTranstockerLane.deleteMany({ where: { transtockerId: storageMeanId } });
    for (const lane of lanes) {
      const laneRecord = await ensureLane(lane);
      await prisma.storageMeanManualTranstockerLane.create({
        data: { transtockerId: storageMeanId, laneId: laneRecord.id, quantity: lane.quantity },
      });
    }
    return;
  }

  if (isAuto) {
    await prisma.storageMeanAutoTranstocker.upsert({
      where: { storageMeanId },
      create: { storageMeanId, emptyReturnLanes: 0, plcType: plcType ?? "siemens" },
      update: plcType ? { plcType } : {},
    });
    await prisma.storageMeanAutoTranstockerLane.deleteMany({ where: { transtockerId: storageMeanId } });
    for (const lane of lanes) {
      const laneRecord = await ensureLane(lane);
      await prisma.storageMeanAutoTranstockerLane.create({
        data: { transtockerId: storageMeanId, laneId: laneRecord.id, quantity: lane.quantity },
      });
    }
  }
}

export async function createStorageMeanAction(_: StorageMeanActionState, formData: FormData): Promise<StorageMeanActionState> {
  const categorySlug = extractString(formData.get("categorySlug"));
  const lanesRaw = extractString(formData.get("lanes"));
  const parsedLanes = parseLanes(lanesRaw);
  const payload = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    price: extractString(formData.get("price")),
    status: extractString(formData.get("status")) as StorageStatus | undefined,
    plantId: extractString(formData.get("plantId")),
    flowId: extractString(formData.get("flowId")),
    supplierId: extractString(formData.get("supplierId")),
    categoryId: extractString(formData.get("categoryId")),
    plcType: extractString(formData.get("plcType")),
  };

  const parsed = storageMeanSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error.issues) };
  }
  if (!categorySlug) {
    return { status: "error", message: "Missing category slug" };
  }
  if (!parsedLanes.success) {
    return { status: "error", message: parsedLanes.error?.issues[0]?.message ?? "Invalid lanes" };
  }

  const prisma = getPrisma() as PrismaClient;
  try {
    const uploadFiles = extractImageFiles(formData);
    const created = await prisma.storageMean.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        status: parsed.data.status,
        plantId: parsed.data.plantId,
        flowId: parsed.data.flowId ?? null,
        supplierId: parsed.data.supplierId ?? null,
        storageMeanCategoryId: parsed.data.categoryId,
      },
    });

    if (uploadFiles.length) {
      for (const file of uploadFiles) {
        const { url } = await persistUploadFile(file);
        const image = await prisma.image.create({ data: { imageUrl: url } });
        await prisma.storageMeanImage.create({ data: { storageMeanId: created.id, imageId: image.id } });
      }
    }

    await syncLanesForCategory({
      categorySlug,
      storageMeanId: created.id,
      lanes: parsedLanes.data,
      plcType: parsed.data.plcType ?? undefined,
      prisma,
    });

    try {
      revalidatePath("/storage-means");
      revalidatePath(`/storage-means/${categorySlug}`);
    } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create storage mean";
    return { status: "error", message };
  }
}

export async function updateStorageMeanAction(_: StorageMeanActionState, formData: FormData): Promise<StorageMeanActionState> {
  const categorySlug = extractString(formData.get("categorySlug"));
  const lanesRaw = extractString(formData.get("lanes"));
  const parsedLanes = parseLanes(lanesRaw);
  const payload = {
    id: extractString(formData.get("id")),
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    price: extractString(formData.get("price")),
    status: extractString(formData.get("status")) as StorageStatus | undefined,
    plantId: extractString(formData.get("plantId")),
    flowId: extractString(formData.get("flowId")),
    supplierId: extractString(formData.get("supplierId")),
    categoryId: extractString(formData.get("categoryId")),
    plcType: extractString(formData.get("plcType")),
  };

  const parsed = storageMeanSchema.extend({ id: z.string().uuid() }).safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error.issues) };
  }
  const removeImageIdsRaw = extractString(formData.get("removeImageIds"));
  const removeImageIds: string[] = removeImageIdsRaw ? JSON.parse(removeImageIdsRaw) : [];
  if (!categorySlug) {
    return { status: "error", message: "Missing category slug" };
  }
  if (!parsedLanes.success) {
    return { status: "error", message: parsedLanes.error?.issues[0]?.message ?? "Invalid lanes" };
  }

  const prisma = getPrisma() as PrismaClient;
  try {
    const uploadFiles = extractImageFiles(formData);

    await prisma.storageMean.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        status: parsed.data.status,
        plantId: parsed.data.plantId,
        flowId: parsed.data.flowId ?? null,
        supplierId: parsed.data.supplierId ?? null,
        storageMeanCategoryId: parsed.data.categoryId,
      },
    });

    if (removeImageIds.length) {
      await prisma.storageMeanImage.deleteMany({ where: { storageMeanId: parsed.data.id, imageId: { in: removeImageIds } } });
      await prisma.image.deleteMany({ where: { id: { in: removeImageIds } } });
    }
    if (uploadFiles.length) {
      for (const file of uploadFiles) {
        const { url } = await persistUploadFile(file);
        const image = await prisma.image.create({ data: { imageUrl: url } });
        await prisma.storageMeanImage.create({ data: { storageMeanId: parsed.data.id, imageId: image.id } });
      }
    }

    await syncLanesForCategory({
      categorySlug,
      storageMeanId: parsed.data.id,
      lanes: parsedLanes.data,
      plcType: parsed.data.plcType ?? undefined,
      prisma,
    });

    try {
      revalidatePath("/storage-means");
      revalidatePath(`/storage-means/${categorySlug}`);
    } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to update storage mean";
    return { status: "error", message };
  }
}

export async function deleteStorageMeanAction(_: StorageMeanActionState, id: string, categorySlug: string): Promise<StorageMeanActionState> {
  const prisma = getPrisma() as PrismaClient;
  try {
    await prisma.storageMean.delete({ where: { id } });
    try {
      revalidatePath("/storage-means");
      revalidatePath(`/storage-means/${categorySlug}`);
    } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to delete storage mean";
    return { status: "error", message };
  }
}
