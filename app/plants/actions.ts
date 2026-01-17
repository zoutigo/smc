"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { persistUploadFile, deleteUploadFileByUrl } from "@/lib/uploads";
import { createPlantSchema, updatePlantSchema } from "./schema";

export type PlantState = { status: "idle" | "error" | "success"; message?: string; fieldErrors?: Record<string, string> };

type PrismaLikeError = { code?: string };
const isPrismaError = (error: unknown): error is PrismaLikeError => typeof error === "object" && error !== null && "code" in error;

export async function getPlants() {
  const prisma = getPrisma();
  try {
    return await prisma.plant.findMany({
      orderBy: { createdAt: "desc" },
      include: { address: { include: { country: true } }, images: { include: { image: true } } },
    });
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `Plant` does not exist. Return empty list until migration is applied.");
      return [];
    }
    throw error;
  }
}

export async function getPlantById(id: string) {
  const prisma = getPrisma();
  try {
    return await prisma.plant.findUnique({
      where: { id },
      include: { address: { include: { country: true } }, images: { include: { image: true } } },
    });
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      console.warn("Prisma table `Plant` does not exist. getPlantById returning null.");
      return null;
    }
    throw error;
  }
}

const extractString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export async function createPlantAction(_: PlantState, formData: FormData): Promise<PlantState> {
  const baseFields = {
    name: extractString(formData.get("plantName") ?? formData.get("name")),
    addressId: extractString(formData.get("addressId")),
  };

  let imageUrl = extractString(formData.get("imageUrl") ?? formData.get("image"));
  const uploadCandidate = formData.get("imageFile");
  if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
    try {
      const { url } = await persistUploadFile(uploadCandidate);
      imageUrl = url;
    } catch {
      return { status: "error", message: "Unable to upload image" };
    }
  }

  const parsed = createPlantSchema.safeParse({ ...baseFields, imageUrl });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { status: "error", fieldErrors };
  }

  const prisma = getPrisma();
  const { name, addressId } = parsed.data;

  try {
    await prisma.plant.create({
      data: {
        name,
        ...(addressId ? { address: { connect: { id: addressId } } } : {}),
        ...(imageUrl
          ? {
              images: {
                create: [
                  {
                    sortOrder: 0,
                    image: { create: { imageUrl } },
                  },
                ],
              },
            }
          : {}),
      },
    });

    try {
      revalidatePath("/plants");
    } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing Plant table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to create plant" };
  }
}

import type { UpdatePlantInput } from "./schema";

export async function updatePlantAction(_s: PlantState, id: string, formData: FormData): Promise<PlantState> {
  const baseFields = {
    name: extractString(formData.get("plantName") ?? formData.get("name")),
    addressId: extractString(formData.get("addressId")),
  };

  const removeImage = String(formData.get("removeImage") ?? "false") === "true";
  const clearAddress = String(formData.get("clearAddress") ?? "false") === "true";
  let imageUrl = extractString(formData.get("imageUrl") ?? formData.get("image"));

  const uploadCandidate = formData.get("imageFile");
  const hasNewUpload = uploadCandidate instanceof File && uploadCandidate.size > 0;
  if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
    try {
      const { url } = await persistUploadFile(uploadCandidate);
      imageUrl = url;
    } catch {
      return { status: "error", message: "Unable to upload image" };
    }
  }

  const parsed = updatePlantSchema.safeParse({ id, ...baseFields, imageUrl });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { status: "error", fieldErrors };
  }

  const prisma = getPrisma();
  const { addressId } = parsed.data as UpdatePlantInput;

  try {
    const existing = await prisma.plant.findUnique({ where: { id }, include: { images: { include: { image: true } } } });
    if (!existing) {
      return { status: "error", message: "Plant not found" };
    }

    const primaryImage = existing.images[0];

    if (hasNewUpload && primaryImage && primaryImage.image?.imageUrl !== imageUrl) {
      try {
        await deleteUploadFileByUrl(primaryImage.image.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete previous image" };
      }
    }

    if (removeImage && primaryImage) {
      try {
        await deleteUploadFileByUrl(primaryImage.image.imageUrl);
      } catch {
        return { status: "error", message: "Unable to delete image" };
      }
      imageUrl = undefined;
    } else if (primaryImage && !imageUrl) {
      imageUrl = primaryImage.image.imageUrl;
    }

    const updatePayload: Prisma.PlantUpdateInput = {
      name: parsed.data.name,
    };
    if (clearAddress) {
      updatePayload.address = { disconnect: true };
    } else if (addressId) {
      updatePayload.address = { connect: { id: addressId } };
    }

    if (removeImage && primaryImage) {
      updatePayload.images = { delete: { plantId_imageId: { plantId: id, imageId: primaryImage.imageId } } };
    } else if (imageUrl) {
      if (primaryImage) {
        updatePayload.images = {
          update: {
            where: { plantId_imageId: { plantId: id, imageId: primaryImage.imageId } },
            data: { image: { update: { imageUrl } } },
          },
        };
      } else {
        updatePayload.images = { create: [{ sortOrder: 0, image: { create: { imageUrl } } }] };
      }
    }

    await prisma.plant.update({ where: { id }, data: updatePayload });
    try { revalidatePath("/plants"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing Plant table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to update plant" };
  }
}

export async function deletePlantAction(_: PlantState, id: string): Promise<PlantState> {
  const prisma = getPrisma();
  try {
    await prisma.plant.delete({ where: { id } });
    try { revalidatePath("/plants"); } catch {}
    return { status: "success" };
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2021") {
      return { status: "error", message: "Database schema not applied (missing Plant table). Run Prisma migrations." };
    }
    return { status: "error", message: "Unable to delete plant" };
  }
}
