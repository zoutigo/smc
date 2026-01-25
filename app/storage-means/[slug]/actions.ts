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
  supplierId: z.string().uuid().optional().nullable(),
  heightMm: z.coerce.number().int().min(0).default(0),
  usefulSurfaceM2: z.coerce.number().min(0).default(0),
  grossSurfaceM2: z.coerce.number().min(0).default(0),
});

const laneSchema = z.object({
  lengthMm: z.number().int().min(1),
  widthMm: z.number().int().min(1),
  heightMm: z.number().int().min(1),
  numberOfLanes: z.number().int().min(1),
});
const lanesSchema = z.array(laneSchema);

const highBaySpecSchema = z.object({
  numberOfLevels: z.number().int().min(0),
  numberOfBays: z.number().int().min(0),
  slotLengthMm: z.number().int().min(0),
  slotWidthMm: z.number().int().min(0),
  slotHeightMm: z.number().int().min(0),
  numberOfSlots: z.number().int().min(0),
});

const staffingLineSchema = z.object({
  shift: z.enum(["SHIFT_1", "SHIFT_2", "SHIFT_3"]),
  workforceType: z.enum(["DIRECT", "INDIRECT"]),
  qty: z.number().min(0),
  role: z.string().min(1),
  description: z.string().optional(),
});

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

const parseFlows = (flowsRaw: string | undefined) => {
  try {
    const parsed = flowsRaw ? JSON.parse(flowsRaw) : [];
    return z.array(z.string().uuid()).min(1).safeParse(parsed);
  } catch {
    const issue: ZodIssue = { code: "custom", message: "Invalid flows", path: [] };
    return { success: false as const, error: new z.ZodError([issue]) };
  }
};

const parseHighBay = (raw: string | undefined) => {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return highBaySpecSchema.safeParse(parsed);
  } catch {
    const issue: ZodIssue = { code: "custom", message: "Invalid high bay specs", path: [] };
    return { success: false as const, error: new z.ZodError([issue]) };
  }
};

const parseStaffing = (raw: string | undefined) => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return z.array(staffingLineSchema).safeParse(parsed);
  } catch {
    const issue: ZodIssue = { code: "custom", message: "Invalid staffing lines", path: [] };
    return { success: false as const, error: new z.ZodError([issue]) };
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
  specType: "lanes" | "highbay";
  storageMeanId: string;
  lanes: Array<{ lengthMm: number; widthMm: number; heightMm: number; numberOfLanes: number }>;
  highBaySpec?: {
    numberOfLevels: number;
    numberOfBays: number;
    slotLengthMm: number;
    slotWidthMm: number;
    slotHeightMm: number;
    numberOfSlots: number;
  };
  prisma: PrismaClient;
}) {
  const { specType, storageMeanId, lanes, prisma, highBaySpec } = params;

  if (specType === "lanes") {
    await prisma.laneGroup.deleteMany({ where: { storageMeanId } });
    if (lanes.length) {
      const laneGroup = await prisma.laneGroup.create({
        data: { storageMeanId, name: "Default lanes" },
      });
      for (const lane of lanes) {
        await prisma.lane.create({
          data: {
            laneGroupId: laneGroup.id,
            lengthMm: lane.lengthMm,
            widthMm: lane.widthMm,
            heightMm: lane.heightMm,
            numberOfLanes: lane.numberOfLanes,
            level: 0,
          },
        });
      }
    }
    // remove high bay spec if switching types
    await prisma.highBayRackSpec.deleteMany({ where: { storageMeanId } });
    return;
  }

  // highbay
  await prisma.laneGroup.deleteMany({ where: { storageMeanId } });
  if (highBaySpec) {
    await prisma.highBayRackSpec.upsert({
      where: { storageMeanId },
      update: highBaySpec,
      create: { storageMeanId, ...highBaySpec },
    });
  }
}

export async function createStorageMeanAction(_: StorageMeanActionState, formData: FormData): Promise<StorageMeanActionState> {
  const categorySlug = extractString(formData.get("categorySlug"));
  const specType = extractString(formData.get("specType")) as "lanes" | "highbay" | undefined;
  const lanesRaw = extractString(formData.get("lanes"));
  const parsedLanes = parseLanes(lanesRaw);
  const parsedFlows = parseFlows(extractString(formData.get("flowIds")));
  const parsedHighBay = parseHighBay(extractString(formData.get("highBaySpec")));
  const parsedStaffing = parseStaffing(extractString(formData.get("staffingLines")));
  const payload = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    price: extractString(formData.get("price")),
    status: extractString(formData.get("status")) as StorageStatus | undefined,
    plantId: extractString(formData.get("plantId")),
    supplierId: extractString(formData.get("supplierId")),
    categoryId: extractString(formData.get("categoryId")),
    heightMm: extractString(formData.get("heightMm")),
    usefulSurfaceM2: extractString(formData.get("usefulSurfaceM2")),
    grossSurfaceM2: extractString(formData.get("grossSurfaceM2")),
  };

  const parsed = storageMeanSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error.issues) };
  }
  if (!categorySlug) {
    return { status: "error", message: "Missing category slug" };
  }
  if (!specType) {
    return { status: "error", message: "Missing spec type" };
  }
  if (!parsedLanes.success) {
    return { status: "error", message: parsedLanes.error?.issues[0]?.message ?? "Invalid lanes" };
  }
  if (!parsedFlows.success) {
    return { status: "error", message: parsedFlows.error?.issues[0]?.message ?? "Invalid flows" };
  }
  if (specType === "highbay" && !parsedHighBay.success) {
    return { status: "error", message: parsedHighBay.error?.issues[0]?.message ?? "Invalid high bay specs" };
  }
  if (!parsedStaffing.success) {
    return { status: "error", message: parsedStaffing.error?.issues[0]?.message ?? "Invalid staffing lines" };
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
        supplierId: parsed.data.supplierId ?? null,
        storageMeanCategoryId: parsed.data.categoryId,
        heightMm: parsed.data.heightMm ?? 0,
        usefulSurfaceM2: parsed.data.usefulSurfaceM2 ?? 0,
        grossSurfaceM2: parsed.data.grossSurfaceM2 ?? 0,
      },
    });

    // flows pivot
    await prisma.storageMeanFlow.createMany({
      data: parsedFlows.data.map((flowId, idx) => ({
        storageMeanId: created.id,
        flowId,
        sortOrder: idx,
      })),
      skipDuplicates: true,
    });

    if (uploadFiles.length) {
      for (const file of uploadFiles) {
        const { url } = await persistUploadFile(file);
        const image = await prisma.image.create({ data: { imageUrl: url } });
        await prisma.storageMeanImage.create({ data: { storageMeanId: created.id, imageId: image.id } });
      }
    }

    await syncLanesForCategory({
      specType,
      storageMeanId: created.id,
      lanes: parsedLanes.data,
      highBaySpec: parsedHighBay.success ? parsedHighBay.data : undefined,
      prisma,
    });

    // staffing
    if (parsedStaffing.data.length) {
      await prisma.staffingLine.createMany({
        data: parsedStaffing.data.map((s) => ({
          storageMeanId: created.id,
          shift: s.shift,
          workforceType: s.workforceType,
          qty: s.qty,
          role: s.role,
          description: s.description ?? null,
        })),
      });
    }

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
  const specType = extractString(formData.get("specType")) as "lanes" | "highbay" | undefined;
  const parsedLanes = parseLanes(extractString(formData.get("lanes")));
  const parsedFlows = parseFlows(extractString(formData.get("flowIds")));
  const parsedHighBay = parseHighBay(extractString(formData.get("highBaySpec")));
  const parsedStaffing = parseStaffing(extractString(formData.get("staffingLines")));
  const payload = {
    id: extractString(formData.get("id")),
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    price: extractString(formData.get("price")),
    status: extractString(formData.get("status")) as StorageStatus | undefined,
    plantId: extractString(formData.get("plantId")),
    supplierId: extractString(formData.get("supplierId")),
    categoryId: extractString(formData.get("categoryId")),
    heightMm: extractString(formData.get("heightMm")),
    usefulSurfaceM2: extractString(formData.get("usefulSurfaceM2")),
    grossSurfaceM2: extractString(formData.get("grossSurfaceM2")),
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
  if (!parsedFlows.success) {
    return { status: "error", message: parsedFlows.error?.issues[0]?.message ?? "Invalid flows" };
  }
  if (specType === "highbay" && !parsedHighBay.success) {
    return { status: "error", message: parsedHighBay.error?.issues[0]?.message ?? "Invalid high bay specs" };
  }
  if (!parsedStaffing.success) {
    return { status: "error", message: parsedStaffing.error?.issues[0]?.message ?? "Invalid staffing lines" };
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
        supplierId: parsed.data.supplierId ?? null,
        storageMeanCategoryId: parsed.data.categoryId,
        heightMm: parsed.data.heightMm ?? 0,
        usefulSurfaceM2: parsed.data.usefulSurfaceM2 ?? 0,
        grossSurfaceM2: parsed.data.grossSurfaceM2 ?? 0,
      },
    });

    await prisma.storageMeanFlow.deleteMany({ where: { storageMeanId: parsed.data.id } });
    await prisma.storageMeanFlow.createMany({
      data: parsedFlows.data.map((flowId, idx) => ({
        storageMeanId: parsed.data.id,
        flowId,
        sortOrder: idx,
      })),
      skipDuplicates: true,
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
      specType: specType ?? "lanes",
      storageMeanId: parsed.data.id,
      lanes: parsedLanes.data,
      highBaySpec: parsedHighBay.success ? parsedHighBay.data : undefined,
      prisma,
    });

    await prisma.staffingLine.deleteMany({ where: { storageMeanId: parsed.data.id } });
    if (parsedStaffing.data.length) {
      await prisma.staffingLine.createMany({
        data: parsedStaffing.data.map((s) => ({
          storageMeanId: parsed.data.id,
          shift: s.shift,
          workforceType: s.workforceType,
          qty: s.qty,
          role: s.role,
          description: s.description ?? null,
        })),
      });
    }

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
