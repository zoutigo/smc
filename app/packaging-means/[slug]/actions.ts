"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { PackagingStatus, NoteTargetType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { persistUploadFile, deleteUploadFileByUrl } from "@/lib/uploads";
import { resolvePackagingMeanSlug } from "../_registry/packagingMean.registry";
import { basePackagingMeanSchema } from "../_registry/base-packaging-mean-schema";

export type PackagingMeanActionState = {
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

const packagingSchema = basePackagingMeanSchema
  .extend({
    id: z.string().uuid().optional(),
    categoryId: z.string().uuid(),
    status: z.nativeEnum(PackagingStatus).default(PackagingStatus.DRAFT),
    accessories: basePackagingMeanSchema.shape.accessories,
    parts: basePackagingMeanSchema.shape.parts,
  })
  .partial({ accessories: true, parts: true });

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

export async function createPackagingMeanAction(_: PackagingMeanActionState, formData: FormData): Promise<PackagingMeanActionState> {
  const payload = {
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    price: extractString(formData.get("price")),
    width: extractString(formData.get("width")),
    length: extractString(formData.get("length")),
    height: extractString(formData.get("height")),
    numberOfPackagings: extractString(formData.get("numberOfPackagings")),
    plantId: extractString(formData.get("plantId")),
    flowId: extractString(formData.get("flowId")),
    supplierId: extractString(formData.get("supplierId")),
    categoryId: extractString(formData.get("categoryId")),
    accessories: (() => {
      try {
        const raw = formData.get("accessories");
        return raw ? JSON.parse(raw as string) : [];
      } catch {
        return [];
      }
    })(),
    parts: (() => {
      try {
        const raw = formData.get("parts");
        return raw ? JSON.parse(raw as string) : [];
      } catch {
        return [];
      }
    })(),
  };

  const parsed = packagingSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error.issues) };
  }

  const prisma = getPrisma() as PrismaClient;
  try {
    const uploadFiles = extractImageFiles(formData);
    const created = await prisma.packagingMean.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        width: parsed.data.width,
        length: parsed.data.length,
        height: parsed.data.height,
        numberOfPackagings: parsed.data.numberOfPackagings,
        status: parsed.data.status,
        plantId: parsed.data.plantId,
        flowId: parsed.data.flowId ?? null,
        supplierId: parsed.data.supplierId ?? null,
        packagingMeanCategoryId: parsed.data.categoryId,
      },
    });

    if (uploadFiles.length) {
      for (const file of uploadFiles) {
        const { url } = await persistUploadFile(file);
        const image = await prisma.image.create({ data: { imageUrl: url } });
        await prisma.packagingMeanImage.create({ data: { packagingMeanId: created.id, imageId: image.id } });
      }
    }

    if (parsed.data.accessories?.length) {
      for (const acc of parsed.data.accessories) {
        await prisma.packagingMeanAccessory.create({
          data: {
            packagingMeanId: created.id,
            accessoryId: acc.accessoryId,
            qtyPerPackaging: acc.qty ?? 1,
          },
        });
      }
    }

    if (parsed.data.parts?.length) {
      for (const part of parsed.data.parts) {
        const slug = `${part.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
        const partRecord = await prisma.part.create({
          data: {
            name: part.name,
            slug,
            partFamilyId: part.partFamilyId,
            projectId: part.projectId ?? null,
          },
        });
        await prisma.packagingMeanPart.create({
          data: {
            packagingMeanId: created.id,
            partId: partRecord.id,
            partsPerPackaging: part.partsPerPackaging ?? 1,
            levelsPerPackaging: part.levelsPerPackaging ?? null,
            verticalPitch: part.verticalPitch ?? null,
            horizontalPitch: part.horizontalPitch ?? null,
            notes: part.notes,
          },
        });
        if (part.accessories?.length) {
          for (const acc of part.accessories) {
            await prisma.partAccessory.create({
              data: {
                partId: partRecord.id,
                accessoryId: acc.accessoryId,
                qtyPerPart: acc.qtyPerPart ?? 1,
              },
            });
          }
        }
      }
    }

    const slug = resolvePackagingMeanSlug(formData.get("categorySlug") as string) ?? "";
    try {
      revalidatePath("/packaging-means");
      if (slug) revalidatePath(`/packaging-means/${slug}`);
    } catch {}
    return { status: "success", id: created.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create packaging mean";
    return { status: "error", message };
  }
}

const noteSchema = z.object({
  packagingMeanId: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
});

export async function createPackagingMeanNoteAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const payload = {
    packagingMeanId: extractString(formData.get("packagingMeanId")),
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
    const noteTargetType = (NoteTargetType?.PACKAGING_MEAN ?? "PACKAGING_MEAN") as NoteTargetType;
    const note = await prisma.note.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content!,
      },
    });

    await prisma.noteLink.create({
      data: {
        noteId: note.id,
        targetId: parsed.data.packagingMeanId!,
        targetType: noteTargetType,
      },
    });

    try {
      revalidatePath("/packaging-means");
      if (parsed.data.slug) {
        revalidatePath(`/packaging-means/${parsed.data.slug}`);
      }
      if (parsed.data.slug && parsed.data.packagingMeanId) {
        revalidatePath(`/packaging-means/${parsed.data.slug}/${parsed.data.packagingMeanId}`);
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

export async function updatePackagingMeanAction(_: PackagingMeanActionState, formData: FormData): Promise<PackagingMeanActionState> {
  const payload = {
    id: extractString(formData.get("id")),
    name: extractString(formData.get("name")),
    description: extractString(formData.get("description")),
    price: extractString(formData.get("price")),
    width: extractString(formData.get("width")),
    length: extractString(formData.get("length")),
    height: extractString(formData.get("height")),
    numberOfPackagings: extractString(formData.get("numberOfPackagings")),
    plantId: extractString(formData.get("plantId")),
    flowId: extractString(formData.get("flowId")),
    supplierId: extractString(formData.get("supplierId")),
    categoryId: extractString(formData.get("categoryId")),
    accessories: (() => {
      try {
        const raw = formData.get("accessories");
        return raw ? JSON.parse(raw as string) : [];
      } catch {
        return [];
      }
    })(),
    parts: (() => {
      try {
        const raw = formData.get("parts");
        return raw ? JSON.parse(raw as string) : [];
      } catch {
        return [];
      }
    })(),
  };

  const parsed = packagingSchema.safeParse(payload);
  if (!parsed.success || !parsed.data.id) {
    return { status: "error", fieldErrors: mapFieldErrors(parsed.error?.issues ?? []) };
  }

  const prisma = getPrisma() as PrismaClient;
  try {
    const uploadFiles = extractImageFiles(formData);
    const existingImages = JSON.parse((formData.get("existingImages") as string) || "[]") as Array<{ id: string; url: string }>;
    const removedIds = JSON.parse((formData.get("removedImageIds") as string) || "[]") as string[];
    const accessories = parsed.data.accessories ?? [];
    const parts = parsed.data.parts ?? [];

    const existing = await prisma.packagingMean.findUnique({
      where: { id: parsed.data.id },
      include: { images: { include: { image: true } }, accessories: true, parts: true },
    });
    if (!existing) return { status: "error", message: "Packaging mean not found" };

    await prisma.packagingMean.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        width: parsed.data.width,
        length: parsed.data.length,
        height: parsed.data.height,
        numberOfPackagings: parsed.data.numberOfPackagings,
        status: parsed.data.status,
        plantId: parsed.data.plantId,
        flowId: parsed.data.flowId ?? null,
        supplierId: parsed.data.supplierId ?? null,
      },
    });

    if (removedIds.length) {
      for (const imageId of removedIds) {
        const pivot = existing.images.find((img) => img.imageId === imageId);
        if (pivot?.image?.imageUrl) {
          try {
            await deleteUploadFileByUrl(pivot.image.imageUrl);
          } catch {}
        }
      }
      await prisma.packagingMeanImage.deleteMany({ where: { packagingMeanId: parsed.data.id, imageId: { in: removedIds } } });
      await prisma.image.deleteMany({ where: { id: { in: removedIds } } });
    }

    if (uploadFiles.length) {
      const sortOffset = existingImages.length;
      let idx = 0;
      for (const file of uploadFiles) {
        const { url } = await persistUploadFile(file);
        const image = await prisma.image.create({ data: { imageUrl: url } });
        await prisma.packagingMeanImage.create({
          data: { packagingMeanId: parsed.data.id, imageId: image.id, sortOrder: sortOffset + idx },
        });
        idx += 1;
      }
    }

    await prisma.packagingMeanAccessory.deleteMany({ where: { packagingMeanId: parsed.data.id } });
    if (accessories.length) {
      for (const acc of accessories) {
        await prisma.packagingMeanAccessory.create({
          data: {
            packagingMeanId: parsed.data.id,
            accessoryId: acc.accessoryId,
            qtyPerPackaging: acc.qty ?? 1,
          },
        });
      }
    }

    await prisma.packagingMeanPart.deleteMany({ where: { packagingMeanId: parsed.data.id } });
    if (parts.length) {
      for (const part of parts) {
        const slug = `${part.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
        const partRecord = await prisma.part.create({
          data: {
            name: part.name,
            slug,
            partFamilyId: part.partFamilyId,
            projectId: part.projectId ?? null,
          },
        });
        await prisma.packagingMeanPart.create({
          data: {
            packagingMeanId: parsed.data.id,
            partId: partRecord.id,
            partsPerPackaging: part.partsPerPackaging ?? 1,
            levelsPerPackaging: part.levelsPerPackaging ?? null,
            verticalPitch: part.verticalPitch ?? null,
            horizontalPitch: part.horizontalPitch ?? null,
            notes: part.notes,
          },
        });
        if (part.accessories?.length) {
          for (const acc of part.accessories) {
            await prisma.partAccessory.create({
              data: {
                partId: partRecord.id,
                accessoryId: acc.accessoryId,
                qtyPerPart: acc.qtyPerPart ?? 1,
              },
            });
          }
        }
      }
    }

    const slug = resolvePackagingMeanSlug(formData.get("categorySlug") as string) ?? "";
    try {
      revalidatePath("/packaging-means");
      if (slug) revalidatePath(`/packaging-means/${slug}`);
      revalidatePath(`/packaging-means/${slug}/${parsed.data.id}`);
    } catch {}
    return { status: "success", id: parsed.data.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to update packaging mean";
    return { status: "error", message };
  }
}
