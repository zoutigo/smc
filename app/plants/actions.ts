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
    return await prisma.plant.findMany({ orderBy: { createdAt: "desc" } });
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
    return await prisma.plant.findUnique({ where: { id } });
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
    plantName: extractString(formData.get("plantName")),
    address: extractString(formData.get("address")),
    city: extractString(formData.get("city")),
    zipcode: extractString(formData.get("zipcode")),
    country: extractString(formData.get("country")),
  };

  let imageUrl = extractString(formData.get("image"));
  const uploadCandidate = formData.get("imageFile");
  if (uploadCandidate instanceof File && uploadCandidate.size > 0) {
    try {
      const { url } = await persistUploadFile(uploadCandidate);
      imageUrl = url;
    } catch {
      return { status: "error", message: "Unable to upload image" };
    }
  }

  const parsed = createPlantSchema.safeParse({ ...baseFields, image: imageUrl });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { status: "error", fieldErrors };
  }

  const prisma = getPrisma();
  const { plantName, city, country, address, zipcode, image } = parsed.data;

  try {
    // ensure uniqueness city + country
    const existing = await prisma.plant.findFirst({ where: { city, country } });
    if (existing) {
      return { status: "error", fieldErrors: { city: "A plant already exists for this city and country" } };
    }

    const createData: Prisma.PlantCreateInput = {
      plantName,
      address: address ?? null,
      city,
      zipcode: zipcode ?? null,
      country,
      image: image ?? null,
    };
    await prisma.plant.create({ data: createData });
    // revalidate plants listing
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
    plantName: extractString(formData.get("plantName")),
    address: extractString(formData.get("address")),
    city: extractString(formData.get("city")),
    zipcode: extractString(formData.get("zipcode")),
    country: extractString(formData.get("country")),
  };

  const existingImage = extractString(formData.get("existingImage"));
  const removeImage = String(formData.get("removeImage") ?? "false") === "true";
  let imageUrl = extractString(formData.get("image"));

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

  const parsed = updatePlantSchema.safeParse({ id, ...baseFields, image: imageUrl });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
    return { status: "error", fieldErrors };
  }

  const prisma = getPrisma();
  const { city, country } = parsed.data as UpdatePlantInput;

  try {
    // check uniqueness excluding self
    const exists = await prisma.plant.findFirst({ where: { city, country, NOT: { id } } });
    if (exists) {
      return { status: "error", fieldErrors: { city: "A plant already exists for this city and country" } };
    }

    const updatePayload = { ...parsed.data } as Record<string, unknown>;
    if (typeof updatePayload.image === "string" && (updatePayload.image as string).trim() === "") {
      delete updatePayload.image;
    }
    if (updatePayload.image === undefined) delete updatePayload.image;
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
