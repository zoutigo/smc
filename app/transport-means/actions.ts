"use server";

import type { PrismaClient, TransportMean, TransportMeanCategory } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

const SKIP_DB = process.env.SKIP_DB_ON_BUILD === "1";

export async function getTransportMeanCategories(): Promise<TransportMeanCategory[]> {
  if (SKIP_DB) return [];
  const prisma = getPrisma() as PrismaClient & { transportMeanCategory?: PrismaClient["transportMeanCategory"] };
  if (!("transportMeanCategory" in prisma)) return [];
  try {
    return await prisma.transportMeanCategory.findMany({ orderBy: { name: "asc" } });
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
        ...(filters?.flowId ? { flowId: filters.flowId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: { supplier: true, transportMeanCategory: true, plant: true, flow: true },
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
