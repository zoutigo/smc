import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { z } from "zod";

import { getPrisma } from "@/lib/prisma";

const KPI_TTL_MS = 1000 * 60 * 5;
const MAX_ITEMS = 200;
const transportCache = new Map<string, { data: TransportKpiResponse; expiresAt: number }>();

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

function buildWhereSql(filters: TransportKpiFilters, alias: "tm" | "cat" = "tm") {
  const conditions: Prisma.Sql[] = [];
  if (filters.plantId) {
    const col = `${alias}.plantId`;
    conditions.push(Prisma.sql`${Prisma.raw(col)} = ${filters.plantId}`);
  }
  if (filters.categorySlug) {
    conditions.push(Prisma.sql`cat.slug = ${filters.categorySlug}`);
  }
  if (!conditions.length) return Prisma.empty;
  if (conditions.length === 1) return Prisma.sql`WHERE ${conditions[0]}`;
  return Prisma.sql`WHERE ${conditions[0]} AND ${conditions[1]}`;
}

export async function getTransportMeansKpis(filters: TransportKpiFilters): Promise<TransportKpiResponse> {
  const start = Date.now();
  const prisma = getPrisma();
  const cacheKey = JSON.stringify(filters);
  const now = Date.now();
  const cached = transportCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.data;
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

  const where: PrismaTypes.TransportMeanWhereInput = {};
  if (filters.plantId) where.plantId = filters.plantId;
  if (filters.categorySlug) where.transportMeanCategory = { slug: filters.categorySlug };

  let transportMeans: Prisma.TransportMeanGetPayload<{
    select: {
      id: true;
      name: true;
      transportMeanCategoryId: true;
      transportMeanCategory: { select: { id: true; name: true; slug: true } };
      plantId: true;
      plant: { select: { id: true; name: true } };
      supplier: { select: { name: true } };
      loadCapacityKg: true;
      units: true;
      maxSpeedKmh: true;
      updatedAt: true;
    };
  }>[] = [];

  try {
    transportMeans = await prisma.transportMean.findMany({
      where,
      select: {
        id: true,
        name: true,
        transportMeanCategoryId: true,
        transportMeanCategory: { select: { id: true, name: true, slug: true } },
        plantId: true,
        plant: { select: { id: true, name: true } },
        supplier: { select: { name: true } },
        loadCapacityKg: true,
        units: true,
        maxSpeedKmh: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_ITEMS,
    });
  } catch (error) {
    console.error("[getTransportMeansKpis] query failed, returning empty KPIs", error);
    return empty;
  }

  // DB-side aggregates to avoid iterating large collections in JS
  const whereSql = buildWhereSql(filters);
  let packagingCoverage = 0;
  let flowsCoverage = 0;
  let multiFlowCount = 0;
  let totalLoadCapacityKg = 0;
  let weightedSpeed = 0;
let totalUnits = 0;
  let countCategories = 0;
  let countPlants = 0;

  try {
    const [coverageRow, flowCovRow, multiFlowRow, loadRow, catCountRow, plantCountRow] = await Promise.all([
      prisma.$queryRaw<{ cnt: bigint | number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT tmpm.packagingMeanId) AS cnt
        FROM TransportMeanPackagingMean tmpm
        JOIN TransportMean tm ON tm.id = tmpm.transportMeanId
        JOIN TransportMeanCategory cat ON cat.id = tm.transportMeanCategoryId
        ${whereSql}
      `),
      prisma.$queryRaw<{ cnt: bigint | number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT tmf.flowId) AS cnt
        FROM TransportMeanFlow tmf
        JOIN TransportMean tm ON tm.id = tmf.transportMeanId
        JOIN TransportMeanCategory cat ON cat.id = tm.transportMeanCategoryId
        ${whereSql}
      `),
      prisma.$queryRaw<{ cnt: bigint | number }[]>(Prisma.sql`
        SELECT COUNT(*) AS cnt FROM (
          SELECT tmf.transportMeanId, COUNT(*) AS c
          FROM TransportMeanFlow tmf
          JOIN TransportMean tm ON tm.id = tmf.transportMeanId
          JOIN TransportMeanCategory cat ON cat.id = tm.transportMeanCategoryId
          ${whereSql}
          GROUP BY tmf.transportMeanId
          HAVING COUNT(*) > 1
        ) sub
      `),
      prisma.$queryRaw<{ totalLoad: bigint | number; weightedSpeed: bigint | number; totalUnits: bigint | number }[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(tm.loadCapacityKg * tm.units), 0)        AS totalLoad,
          COALESCE(SUM(tm.maxSpeedKmh * tm.units), 0)          AS weightedSpeed,
          COALESCE(SUM(tm.units), 0)                           AS totalUnits
        FROM TransportMean tm
        JOIN TransportMeanCategory cat ON cat.id = tm.transportMeanCategoryId
        ${whereSql}
      `),
      prisma.$queryRaw<{ cnt: bigint | number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT cat.id) AS cnt
        FROM TransportMean tm
        JOIN TransportMeanCategory cat ON cat.id = tm.transportMeanCategoryId
        ${whereSql}
      `),
      prisma.$queryRaw<{ cnt: bigint | number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT tm.plantId) AS cnt
        FROM TransportMean tm
        JOIN TransportMeanCategory cat ON cat.id = tm.transportMeanCategoryId
        ${whereSql}
      `),
    ]);

    packagingCoverage = Number(coverageRow[0]?.cnt ?? 0);
    flowsCoverage = Number(flowCovRow[0]?.cnt ?? 0);
    multiFlowCount = Number(multiFlowRow[0]?.cnt ?? 0);
    totalLoadCapacityKg = Number(loadRow[0]?.totalLoad ?? 0);
    weightedSpeed = Number(loadRow[0]?.weightedSpeed ?? 0);
    totalUnits = Number(loadRow[0]?.totalUnits ?? 0);
    countCategories = Number(catCountRow[0]?.cnt ?? 0);
    countPlants = Number(plantCountRow[0]?.cnt ?? 0);
  } catch (error) {
    console.error("[getTransportMeansKpis] aggregate queries failed", error);
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
    packagingMeanIds: [],
    packagingCount: 0,
    flowIds: [],
  }));

  const computedUnits = computed.reduce((sum, tm) => sum + tm.units, 0) || 1;

  const overview: TransportKpiResponse["overview"] = {
    countTransportMeans: computed.length,
    countCategories: countCategories || new Set(computed.map((c) => c.categoryId)).size,
    countPlants: countPlants || new Set(computed.map((c) => c.plantId)).size,
    totalLoadCapacityKg: totalLoadCapacityKg || computed.reduce((sum, tm) => sum + tm.loadTotal, 0),
    avgMaxSpeedKmh:
      totalUnits > 0
        ? weightedSpeed / totalUnits
        : computed.reduce((sum, tm) => sum + tm.maxSpeedKmh * tm.units, 0) / computedUnits,
    packagingCoverage,
    flowsCoverage,
    multiFlowCount,
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
    capacityByPlant: Array.from(capacityByPlantMap.entries())
      .map(([plantId, value]) => ({
        plantId,
        plantName: value.plantName,
        loadTotal: value.loadTotal,
      }))
      .sort((a, b) => b.loadTotal - a.loadTotal)
      .slice(0, 15),
    capacityByCategory: Array.from(capacityByCategoryMap.entries())
      .map(([categoryId, value]) => ({
        categoryId,
        categoryName: value.categoryName,
        loadTotal: value.loadTotal,
      }))
      .sort((a, b) => b.loadTotal - a.loadTotal)
      .slice(0, 15),
    supplierDonut: Array.from(supplierDonutMap.entries())
      .map(([supplierName, count]) => ({ supplierName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    capacitySpeedScatter: (computed.length > 80 ? computed.slice(0, 80) : computed).map((tm) => ({
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

  transportCache.set(cacheKey, { data: result, expiresAt: now + KPI_TTL_MS });
  if (process.env.DASHBOARD_DEBUG) {
    console.debug?.("[getTransportMeansKpis] duration(ms)", Date.now() - start, "items", transportMeans.length);
  }
  return result;
}
