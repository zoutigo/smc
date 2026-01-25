import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { getPrisma } from "@/lib/prisma";

const KPI_TTL_MS = 1000 * 60 * 5;
let cachedTransportKpi: { data: TransportKpiResponse; key: string; expiresAt: number } | null = null;

export const transportKpiFiltersSchema = z.object({
  plantId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
});

export type TransportKpiFilters = z.infer<typeof transportKpiFiltersSchema>;

export function parseTransportKpiFilters(params: URLSearchParams | Record<string, string | string[] | undefined>): TransportKpiFilters {
  const asObject =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
        );

  const parsed = transportKpiFiltersSchema.safeParse(asObject);
  if (!parsed.success) {
    throw parsed.error;
  }

  return {
    plantId: parsed.data.plantId || undefined,
    categorySlug: parsed.data.categorySlug || undefined,
  };
}

type TransportComputed = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  plantId: string;
  plantName?: string | null;
  supplierName?: string | null;
  loadCapacityKg: number;
  units: number;
  maxSpeedKmh: number;
  loadTotal: number;
  packagingCount: number;
  packagingMeanIds: string[];
  flowIds: string[];
};

export type TransportKpiResponse = {
  overview: {
    countTransportMeans: number;
    countCategories: number;
    countPlants: number;
    totalLoadCapacityKg: number;
    avgMaxSpeedKmh: number;
    packagingCoverage: number;
    flowsCoverage: number;
    multiFlowCount: number;
  };
  charts: {
    countByCategory: { categoryId: string; categoryName: string; count: number }[];
    capacityByPlant: { plantId: string; plantName: string; loadTotal: number }[];
    capacityByCategory: { categoryId: string; categoryName: string; loadTotal: number }[];
    supplierDonut: { supplierName: string; count: number }[];
    capacitySpeedScatter: { id: string; name: string; categoryName: string; loadCapacityKg: number; maxSpeedKmh: number }[];
  };
  table: {
    id: string;
    name: string;
    plantName?: string | null;
    categoryName: string;
    supplierName?: string | null;
    loadCapacityKg: number;
    units: number;
    loadTotal: number;
    maxSpeedKmh: number;
  }[];
};

export async function getTransportMeansKpis(filters: TransportKpiFilters): Promise<TransportKpiResponse> {
  const prisma = getPrisma();
  const cacheKey = JSON.stringify(filters);
  const now = Date.now();
  if (cachedTransportKpi && cachedTransportKpi.key === cacheKey && cachedTransportKpi.expiresAt > now) {
    return cachedTransportKpi.data;
  }
  const empty: TransportKpiResponse = {
    overview: {
      countTransportMeans: 0,
      countCategories: 0,
      countPlants: 0,
      totalLoadCapacityKg: 0,
      avgMaxSpeedKmh: 0,
      packagingCoverage: 0,
      flowsCoverage: 0,
      multiFlowCount: 0,
    },
    charts: {
      countByCategory: [],
      capacityByPlant: [],
      capacityByCategory: [],
      supplierDonut: [],
      capacitySpeedScatter: [],
    },
    table: [],
  };

  const where: Prisma.TransportMeanWhereInput = {};
  if (filters.plantId) where.plantId = filters.plantId;
  if (filters.categorySlug) where.transportMeanCategory = { slug: filters.categorySlug };

  let transportMeans: Prisma.TransportMeanGetPayload<{
    include: {
      transportMeanCategory: { select: { id: true; name: true; slug: true } };
      plant: { select: { id: true; name: true } };
      supplier: { select: { name: true } };
      packagingLinks: { select: { packagingMeanId: true } };
      flows: { select: { flowId: true } };
    };
  }>[] = [];

  try {
    transportMeans = await prisma.transportMean.findMany({
      where,
      include: {
        transportMeanCategory: { select: { id: true, name: true, slug: true } },
        plant: { select: { id: true, name: true } },
        supplier: { select: { name: true } },
        packagingLinks: { select: { packagingMeanId: true } },
        flows: { select: { flowId: true } },
      },
    });
  } catch (error) {
    console.error("[getTransportMeansKpis] query failed, returning empty KPIs", error);
    return empty;
  }

  const computed: TransportComputed[] = transportMeans.map((tm) => ({
    id: tm.id,
    name: tm.name,
    categoryId: tm.transportMeanCategoryId,
    categoryName: tm.transportMeanCategory?.name ?? "Unknown",
    categorySlug: tm.transportMeanCategory?.slug ?? "unknown",
    plantId: tm.plantId,
    plantName: tm.plant?.name,
    supplierName: tm.supplier?.name ?? "Unassigned",
    loadCapacityKg: tm.loadCapacityKg,
    units: tm.units,
    maxSpeedKmh: tm.maxSpeedKmh,
    loadTotal: tm.loadCapacityKg * tm.units,
    packagingMeanIds: tm.packagingLinks.map((l) => l.packagingMeanId),
    packagingCount: new Set(tm.packagingLinks.map((l) => l.packagingMeanId)).size,
    flowIds: [
      ...(tm.flowId ? [tm.flowId] : []),
      ...tm.flows.map((f) => f.flowId),
    ],
  }));

  const totalUnits = computed.reduce((sum, tm) => sum + tm.units, 0) || 1;

  const overview: TransportKpiResponse["overview"] = {
    countTransportMeans: computed.length,
    countCategories: new Set(computed.map((c) => c.categoryId)).size,
    countPlants: new Set(computed.map((c) => c.plantId)).size,
    totalLoadCapacityKg: computed.reduce((sum, tm) => sum + tm.loadTotal, 0),
    avgMaxSpeedKmh: computed.reduce((sum, tm) => sum + tm.maxSpeedKmh * tm.units, 0) / totalUnits,
    packagingCoverage: computed.reduce((set, tm) => {
      tm.packagingMeanIds.forEach((id) => set.add(id));
      return set;
    }, new Set<string>()).size,
    flowsCoverage: computed.reduce((set, tm) => {
      tm.flowIds.forEach((id) => id && set.add(id));
      return set;
    }, new Set<string>()).size,
    multiFlowCount: computed.filter((tm) => tm.flowIds.filter(Boolean).length > 1).length,
  };

  const countByCategoryMap = new Map<string, { categoryName: string; count: number }>();
  const capacityByPlantMap = new Map<string, { plantName: string; loadTotal: number }>();
  const capacityByCategoryMap = new Map<string, { categoryName: string; loadTotal: number }>();
  const supplierDonutMap = new Map<string, number>();

  computed.forEach((tm) => {
    countByCategoryMap.set(tm.categoryId, {
      categoryName: tm.categoryName,
      count: (countByCategoryMap.get(tm.categoryId)?.count ?? 0) + 1,
    });

    capacityByPlantMap.set(tm.plantId, {
      plantName: tm.plantName ?? "Unknown plant",
      loadTotal: (capacityByPlantMap.get(tm.plantId)?.loadTotal ?? 0) + tm.loadTotal,
    });

    capacityByCategoryMap.set(tm.categoryId, {
      categoryName: tm.categoryName,
      loadTotal: (capacityByCategoryMap.get(tm.categoryId)?.loadTotal ?? 0) + tm.loadTotal,
    });

    const supplierKey = tm.supplierName ?? "Unassigned";
    supplierDonutMap.set(supplierKey, (supplierDonutMap.get(supplierKey) ?? 0) + 1);
  });

  const charts: TransportKpiResponse["charts"] = {
    countByCategory: Array.from(countByCategoryMap.entries()).map(([categoryId, value]) => ({
      categoryId,
      categoryName: value.categoryName,
      count: value.count,
    })),
    capacityByPlant: Array.from(capacityByPlantMap.entries()).map(([plantId, value]) => ({
      plantId,
      plantName: value.plantName,
      loadTotal: value.loadTotal,
    })),
    capacityByCategory: Array.from(capacityByCategoryMap.entries()).map(([categoryId, value]) => ({
      categoryId,
      categoryName: value.categoryName,
      loadTotal: value.loadTotal,
    })),
    supplierDonut: Array.from(supplierDonutMap.entries()).map(([supplierName, count]) => ({ supplierName, count })),
    capacitySpeedScatter: computed.map((tm) => ({
      id: tm.id,
      name: tm.name,
      categoryName: tm.categoryName,
      loadCapacityKg: tm.loadCapacityKg,
      maxSpeedKmh: tm.maxSpeedKmh,
    })),
  };

  const table = computed
    .slice()
    .sort((a, b) => b.loadTotal - a.loadTotal)
    .slice(0, 20)
    .map((tm) => ({
      id: tm.id,
      name: tm.name,
      plantName: tm.plantName,
      categoryName: tm.categoryName,
      supplierName: tm.supplierName,
      loadCapacityKg: tm.loadCapacityKg,
      units: tm.units,
      loadTotal: tm.loadTotal,
      maxSpeedKmh: tm.maxSpeedKmh,
    }));

  const result: TransportKpiResponse = {
    overview,
    charts,
    table,
  };

  cachedTransportKpi = { data: result, key: cacheKey, expiresAt: now + KPI_TTL_MS };
  return result;
}
