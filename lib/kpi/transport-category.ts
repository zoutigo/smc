import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { getPrisma } from "@/lib/prisma";

export const transportCategoryFiltersSchema = z.object({
  plantId: z.string().uuid().optional(),
});

export type TransportCategoryFilters = z.infer<typeof transportCategoryFiltersSchema>;

export function parseTransportCategoryFilters(params: URLSearchParams | Record<string, string | string[] | undefined>): TransportCategoryFilters {
  const asObject =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
        );

  const parsed = transportCategoryFiltersSchema.safeParse(asObject);
  if (!parsed.success) throw parsed.error;

  return { plantId: parsed.data.plantId || undefined };
}

export type TransportCategoryKpiResponse = {
  overview: {
    countTransportMeans: number;
    totalUnits: number;
    totalLoadKg: number;
    avgLoadPerUnit: number;
    avgMaxSpeedKmh: number;
    packagingCompatibility: number;
    flowsCovered: number;
  };
  charts: {
    loadByPlant: { plantId: string; plantName: string; loadTotal: number }[];
    unitsByPlant: { plantId: string; plantName: string; units: number }[];
    packagingPerMean: { id: string; name: string; packagingCount: number }[];
    loadHistogram: { bucket: string; count: number }[];
  };
  table: {
    id: string;
    name: string;
    plantName?: string | null;
    supplierName?: string | null;
    packagingCount: number;
    flowsCount: number;
    loadCapacityKg: number;
    units: number;
    maxSpeedKmh: number;
  }[];
};

export async function getTransportCategoryKpis(categorySlug: string, filters: TransportCategoryFilters): Promise<TransportCategoryKpiResponse> {
  const prisma = getPrisma();

  const where: Prisma.TransportMeanWhereInput = {
    transportMeanCategory: { slug: categorySlug },
  };
  if (filters.plantId) where.plantId = filters.plantId;

  const transportMeans = await prisma.transportMean.findMany({
    where,
    include: {
      plant: { select: { id: true, name: true } },
      supplier: { select: { name: true } },
      packagingLinks: { select: { packagingMeanId: true } },
      flows: { select: { flowId: true } },
    },
  });

  const totalUnits = transportMeans.reduce((sum, tm) => sum + tm.units, 0) || 1;
  const overview: TransportCategoryKpiResponse["overview"] = {
    countTransportMeans: transportMeans.length,
    totalUnits,
    totalLoadKg: transportMeans.reduce((sum, tm) => sum + tm.loadCapacityKg * tm.units, 0),
    avgLoadPerUnit: transportMeans.reduce((sum, tm) => sum + tm.loadCapacityKg, 0) / (transportMeans.length || 1),
    avgMaxSpeedKmh: transportMeans.reduce((sum, tm) => sum + tm.maxSpeedKmh * tm.units, 0) / totalUnits,
    packagingCompatibility: new Set(transportMeans.flatMap((tm) => tm.packagingLinks.map((l) => l.packagingMeanId))).size,
    flowsCovered: new Set(transportMeans.flatMap((tm) => tm.flows.map((f) => f.flowId))).size,
  };

  const loadByPlantMap = new Map<string, { plantName: string; loadTotal: number }>();
  const unitsByPlantMap = new Map<string, { plantName: string; units: number }>();

  transportMeans.forEach((tm) => {
    if (!tm.plant) return;
    loadByPlantMap.set(tm.plant.id, {
      plantName: tm.plant.name,
      loadTotal: (loadByPlantMap.get(tm.plant.id)?.loadTotal ?? 0) + tm.loadCapacityKg * tm.units,
    });
    unitsByPlantMap.set(tm.plant.id, {
      plantName: tm.plant.name,
      units: (unitsByPlantMap.get(tm.plant.id)?.units ?? 0) + tm.units,
    });
  });

  const packagingPerMean = transportMeans
    .map((tm) => ({ id: tm.id, name: tm.name, packagingCount: new Set(tm.packagingLinks.map((l) => l.packagingMeanId)).size }))
    .sort((a, b) => b.packagingCount - a.packagingCount)
    .slice(0, 10);

  const histogramBuckets = [0, 100, 250, 500, 750, 1000, 2000];
  const loadHistogramCounts: Record<string, number> = {};
  histogramBuckets.forEach((b) => (loadHistogramCounts[`≤ ${b}kg`] = 0));
  loadHistogramCounts["> 2000kg"] = 0;
  transportMeans.forEach((tm) => {
    const load = tm.loadCapacityKg;
    const bucket = histogramBuckets.find((b) => load <= b);
    if (bucket !== undefined) loadHistogramCounts[`≤ ${bucket}kg`] += 1;
    else loadHistogramCounts["> 2000kg"] += 1;
  });

  const table = transportMeans
    .map((tm) => ({
      id: tm.id,
      name: tm.name,
      plantName: tm.plant?.name,
      supplierName: tm.supplier?.name,
      packagingCount: new Set(tm.packagingLinks.map((l) => l.packagingMeanId)).size,
      flowsCount: new Set(tm.flows.map((f) => f.flowId)).size,
      loadCapacityKg: tm.loadCapacityKg,
      units: tm.units,
      maxSpeedKmh: tm.maxSpeedKmh,
    }))
    .sort((a, b) => b.loadCapacityKg * b.units - a.loadCapacityKg * a.units);

  return {
    overview,
    charts: {
      loadByPlant: Array.from(loadByPlantMap.entries()).map(([plantId, value]) => ({
        plantId,
        plantName: value.plantName,
        loadTotal: value.loadTotal,
      })),
      unitsByPlant: Array.from(unitsByPlantMap.entries()).map(([plantId, value]) => ({
        plantId,
        plantName: value.plantName,
        units: value.units,
      })),
      packagingPerMean,
      loadHistogram: Object.entries(loadHistogramCounts).map(([bucket, count]) => ({ bucket, count })),
    },
    table,
  };
}
