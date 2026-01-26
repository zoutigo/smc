import type { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/prisma";

type SimpleRow = { name: string; value: number };
type DonutRow = { name: string; value: number };

export type StorageDashboardData = {
  metrics: Array<{ label: string; value: string; helper?: string }>;
  surfaceByPlant: SimpleRow[];
  efficiencyByCategory: SimpleRow[];
  meansByCategory: DonutRow[];
  workforceByPlant: SimpleRow[];
  lanesByPlant: SimpleRow[];
  topSurface: Array<{ name: string; plant: string; category: string; usefulSurface: number; lanes: number }>;
  topWorkforce: Array<{ name: string; plant: string; category: string; workforce: number; lanes: number }>;
  occupancyCards: {
    totalQty: number;
    totalValue: number;
    totalMaxQty: number;
    occupancyPct: number;
    overCapacityCount: number;
    configuredPct: number;
    configuredCount: number;
    distinctPackagingCount: number;
    slotsRemaining: number;
  };
  occupancyByPlant: Array<{ name: string; occupancyPct: number; qty: number; maxQty: number; value: number }>;
  valueByPlant: SimpleRow[];
  configuredDonut: DonutRow[];
  storageTable: Array<{
    id: string;
    name: string;
    plant: string;
    category: string;
    qty: number;
    maxQty: number;
    occupancyPct: number;
    value: number;
    slotsRemaining: number;
    distinctPackaging: number;
  }>;
  storageOccupancyDetail: Array<{
    id: string;
    name: string;
    plant: string;
    category: string;
    qty: number;
    maxQty: number;
    occupancyPct: number;
    value: number;
    slotsRemaining: number;
    distinctPackaging: number;
  }>;
  topStoredPackaging: Array<{ name: string; qty: number; value: number }>;
};

type StorageMeanWithRelations = Prisma.StorageMeanGetPayload<{
  include: {
    plant: { select: { id: true; name: true } };
    storageMeanCategory: { select: { id: true; name: true; slug: true } };
    staffingLines: true;
    laneGroups: { include: { lanes: true } };
    packagingLinks: {
      include: {
        packagingMean: {
          select: {
            id: true;
            name: true;
            price: true;
            packagingMeanCategory: { select: { id: true; name: true; slug: true } };
            plant: { select: { id: true; name: true } };
          };
        };
      };
    };
  };
}>;

const TTL_MS = 1000 * 60 * 5;
let cache: { data: StorageDashboardData; expiresAt: number } | null = null;
const categoryCache = new Map<string, { data: StorageDashboardData; expiresAt: number }>();
const rawCache = new Map<string, { data: StorageMeanWithRelations[]; expiresAt: number }>();

const toNumber = (val: Prisma.Decimal | number | null | undefined) => {
  if (val === null || val === undefined) return 0;
  // Prisma Decimal has toNumber
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyVal: any = val;
  if (typeof anyVal.toNumber === "function") return anyVal.toNumber();
  return Number(val) || 0;
};

export async function getStorageMeansWithRelations(categorySlug?: string): Promise<StorageMeanWithRelations[]> {
  const now = Date.now();
  const cacheKey = categorySlug ?? "__all__";
  const entry = rawCache.get(cacheKey);
  if (entry && entry.expiresAt > now) return entry.data;

  const prisma = getPrisma();
  let data: StorageMeanWithRelations[] = [];
  try {
    data = await prisma.storageMean.findMany({
      include: {
        plant: { select: { id: true, name: true } },
        storageMeanCategory: { select: { id: true, name: true, slug: true } },
        staffingLines: true,
        laneGroups: { include: { lanes: true } },
        packagingLinks: {
          include: {
            packagingMean: {
              select: {
                id: true,
                name: true,
                price: true,
                packagingMeanCategory: { select: { id: true, name: true, slug: true } },
                plant: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      where: categorySlug
        ? {
            storageMeanCategory: {
              slug: categorySlug,
            },
          }
        : undefined,
    });
  } catch (err) {
    console.error("[storage-dashboard] failed to load storage means", err);
    return [];
  }

  rawCache.set(cacheKey, { data, expiresAt: now + TTL_MS });
  return data;
}

async function compute(categorySlug?: string): Promise<StorageDashboardData> {
  try {
    const storageMeans = await getStorageMeansWithRelations(categorySlug);

    const categories = new Set(storageMeans.map((sm) => sm.storageMeanCategory?.name ?? "Uncategorized"));
    const plants = new Set(storageMeans.map((sm) => sm.plant?.name ?? "Unknown"));

    const totalUseful = storageMeans.reduce((sum, sm) => sum + toNumber(sm.usefulSurfaceM2), 0);
    const totalGross = storageMeans.reduce((sum, sm) => sum + toNumber(sm.grossSurfaceM2), 0);
    const efficiencyPct = totalGross > 0 ? (totalUseful / totalGross) * 100 : 0;
    const totalValue = storageMeans.reduce((sum, sm) => sum + sm.price, 0);

    const totalLaneGroups = storageMeans.reduce((sum, sm) => sum + sm.laneGroups.length, 0);
    const totalLanes = storageMeans.reduce(
      (sum, sm) =>
        sum +
        sm.laneGroups.reduce((lgSum, lg) => lgSum + lg.lanes.reduce((lSum, l) => lSum + (l.numberOfLanes ?? 0), 0), 0),
      0,
    );

    const totalWorkforce = storageMeans.reduce(
      (sum, sm) => sum + sm.staffingLines.reduce((acc, line) => acc + toNumber(line.qty), 0),
      0,
    );

    const metrics: StorageDashboardData["metrics"] = [
      { label: "Storage means", value: storageMeans.length.toString() },
      { label: "Categories", value: categories.size.toString() },
      { label: "Plants", value: plants.size.toString() },
      { label: "Useful surface", value: `${totalUseful.toFixed(1)} m²` },
      { label: "Gross surface", value: `${totalGross.toFixed(1)} m²` },
      { label: "Efficiency", value: `${efficiencyPct.toFixed(1)}%` },
      { label: "Value", value: `€${totalValue.toLocaleString()}` },
      { label: "LaneGroups / Lanes", value: `${totalLaneGroups} / ${totalLanes}` },
      { label: "Workforce (qty)", value: totalWorkforce.toFixed(2) },
    ];

    const surfaceByPlantMap = new Map<string, number>();
    storageMeans.forEach((sm) => {
      const name = sm.plant?.name ?? "Unknown";
      surfaceByPlantMap.set(name, (surfaceByPlantMap.get(name) ?? 0) + toNumber(sm.usefulSurfaceM2));
    });
    const surfaceByPlant = Array.from(surfaceByPlantMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const efficiencyByCategoryMap = new Map<string, { useful: number; gross: number }>();
    storageMeans.forEach((sm) => {
      const name = sm.storageMeanCategory?.name ?? "Uncategorized";
      const current = efficiencyByCategoryMap.get(name) ?? { useful: 0, gross: 0 };
      efficiencyByCategoryMap.set(name, {
        useful: current.useful + toNumber(sm.usefulSurfaceM2),
        gross: current.gross + toNumber(sm.grossSurfaceM2),
      });
    });
    const efficiencyByCategory = Array.from(efficiencyByCategoryMap, ([name, agg]) => ({
      name,
      value: agg.gross > 0 ? (agg.useful / agg.gross) * 100 : 0,
    })).sort((a, b) => b.value - a.value);

    const meansByCategoryMap = new Map<string, number>();
    storageMeans.forEach((sm) => {
      const name = sm.storageMeanCategory?.name ?? "Uncategorized";
      meansByCategoryMap.set(name, (meansByCategoryMap.get(name) ?? 0) + 1);
    });
    const meansByCategory = Array.from(meansByCategoryMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const workforceByPlantMap = new Map<string, number>();
    storageMeans.forEach((sm) => {
      const plantName = sm.plant?.name ?? "Unknown";
      const qty = sm.staffingLines.reduce((acc, line) => acc + toNumber(line.qty), 0);
      workforceByPlantMap.set(plantName, (workforceByPlantMap.get(plantName) ?? 0) + qty);
    });
    const workforceByPlant = Array.from(workforceByPlantMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const lanesByPlantMap = new Map<string, number>();
    storageMeans.forEach((sm) => {
      const plantName = sm.plant?.name ?? "Unknown";
      const lanes = sm.laneGroups.reduce((acc, lg) => acc + lg.lanes.reduce((lAcc, l) => lAcc + (l.numberOfLanes ?? 0), 0), 0);
      lanesByPlantMap.set(plantName, (lanesByPlantMap.get(plantName) ?? 0) + lanes);
    });
    const lanesByPlant = Array.from(lanesByPlantMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const topSurface = storageMeans
      .map((sm) => ({
        name: sm.name,
        plant: sm.plant?.name ?? "Unknown",
        category: sm.storageMeanCategory?.name ?? "Uncategorized",
        usefulSurface: toNumber(sm.usefulSurfaceM2),
        lanes: sm.laneGroups.reduce((acc, lg) => acc + lg.lanes.reduce((lAcc, l) => lAcc + (l.numberOfLanes ?? 0), 0), 0),
      }))
      .sort((a, b) => b.usefulSurface - a.usefulSurface)
      .slice(0, 10);

    const topWorkforce = storageMeans
      .map((sm) => ({
        name: sm.name,
        plant: sm.plant?.name ?? "Unknown",
        category: sm.storageMeanCategory?.name ?? "Uncategorized",
        workforce: sm.staffingLines.reduce((acc, line) => acc + toNumber(line.qty), 0),
        lanes: sm.laneGroups.reduce((acc, lg) => acc + lg.lanes.reduce((lAcc, l) => lAcc + (l.numberOfLanes ?? 0), 0), 0),
      }))
      .sort((a, b) => b.workforce - a.workforce)
      .slice(0, 10);

    // Occupancy & value
    const occupancyByPlantMap = new Map<string, { qty: number; maxQty: number; value: number }>();
    let totalQty = 0;
    let totalMaxQty = 0;
    let totalValueStored = 0;
    let overCapacityCount = 0;
    let configuredCount = 0;
    let slotsRemaining = 0;
    const storageTable: StorageDashboardData["storageTable"] = [];
    const packagingSet = new Set<string>();
    const packagingAgg = new Map<string, { name: string; qty: number; value: number }>();

    storageMeans.forEach((sm) => {
      const qty = sm.packagingLinks.reduce((sum, link) => sum + (link.qty ?? 0), 0);
      const maxQty = sm.packagingLinks.reduce((sum, link) => sum + (link.maxQty ?? 0), 0);
      const value = sm.packagingLinks.reduce(
        (sum, link) => sum + (link.qty ?? 0) * (link.packagingMean?.price ?? 0),
        0,
      );
      const plantName = sm.plant?.name ?? "Unknown";

      sm.packagingLinks.forEach((link) => {
        if (link.packagingMeanId) packagingSet.add(link.packagingMeanId);
        const pmId = link.packagingMeanId ?? link.packagingMean?.name ?? "unknown";
        const current = packagingAgg.get(pmId) ?? {
          name: link.packagingMean?.name ?? "Unknown packaging",
          qty: 0,
          value: 0,
        };
        current.qty += link.qty ?? 0;
        current.value += (link.qty ?? 0) * (link.packagingMean?.price ?? 0);
        packagingAgg.set(pmId, current);
      });

      totalQty += qty;
      totalMaxQty += maxQty;
      totalValueStored += value;
      if (maxQty > 0) {
        configuredCount += 1;
        slotsRemaining += maxQty - qty;
      }
      if (maxQty > 0 && qty > maxQty) overCapacityCount += 1;

      const plantEntry = occupancyByPlantMap.get(plantName) ?? { qty: 0, maxQty: 0, value: 0 };
      plantEntry.qty += qty;
      plantEntry.maxQty += maxQty;
      plantEntry.value += value;
      occupancyByPlantMap.set(plantName, plantEntry);

      storageTable.push({
        id: sm.id,
        name: sm.name,
        plant: plantName,
        category: sm.storageMeanCategory?.name ?? "Uncategorized",
        qty,
        maxQty,
        occupancyPct: maxQty > 0 ? (qty / maxQty) * 100 : 0,
        value,
        slotsRemaining: maxQty > 0 ? maxQty - qty : 0,
        distinctPackaging: new Set(sm.packagingLinks.map((l) => l.packagingMeanId)).size,
      });
    });

    const occupancyByPlant = Array.from(occupancyByPlantMap.entries())
      .map(([name, value]) => ({
        name,
        occupancyPct: value.maxQty > 0 ? (value.qty / value.maxQty) * 100 : 0,
        qty: value.qty,
        maxQty: value.maxQty,
        value: value.value,
      }))
      .sort((a, b) => b.occupancyPct - a.occupancyPct);

    const configuredPct = storageMeans.length ? (configuredCount / storageMeans.length) * 100 : 0;
    const occupancyPct = totalMaxQty > 0 ? (totalQty / totalMaxQty) * 100 : 0;

    const topStoredPackaging = Array.from(packagingAgg.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const storageOccupancyDetail = storageTable
      .slice()
      .sort((a, b) => b.occupancyPct - a.occupancyPct || b.value - a.value);

    return {
      metrics,
      surfaceByPlant,
      efficiencyByCategory,
      meansByCategory,
      workforceByPlant,
      lanesByPlant,
      topSurface,
      topWorkforce,
      occupancyCards: {
        totalQty,
        totalValue: totalValueStored,
        totalMaxQty,
        occupancyPct,
        overCapacityCount,
        configuredPct,
        configuredCount,
        distinctPackagingCount: packagingSet.size,
        slotsRemaining,
      },
      occupancyByPlant,
      valueByPlant: occupancyByPlant
        .map((p) => ({ name: p.name, value: p.value }))
        .sort((a, b) => b.value - a.value),
      configuredDonut: [
        { name: "Paramétrés (maxQty)", value: configuredCount },
        { name: "Sans maxQty", value: storageMeans.length - configuredCount },
      ],
      storageTable: storageOccupancyDetail.slice(0, 20),
      storageOccupancyDetail,
      topStoredPackaging,
    };
  } catch (err) {
    console.error("[storage-dashboard] failed to compute", err);
    return {
      metrics: [],
      surfaceByPlant: [],
      efficiencyByCategory: [],
      meansByCategory: [],
      workforceByPlant: [],
      lanesByPlant: [],
      topSurface: [],
      topWorkforce: [],
      occupancyCards: {
        totalQty: 0,
        totalValue: 0,
        totalMaxQty: 0,
        occupancyPct: 0,
        overCapacityCount: 0,
        configuredPct: 0,
        configuredCount: 0,
        distinctPackagingCount: 0,
        slotsRemaining: 0,
      },
      occupancyByPlant: [],
      valueByPlant: [],
      configuredDonut: [],
      storageTable: [],
      storageOccupancyDetail: [],
      topStoredPackaging: [],
    };
  }
}

export async function getStorageDashboardData(categorySlug?: string): Promise<StorageDashboardData> {
  const now = Date.now();

  if (!categorySlug && cache && cache.expiresAt > now) return cache.data;
  if (categorySlug) {
    const entry = categoryCache.get(categorySlug);
    if (entry && entry.expiresAt > now) return entry.data;
  }

  const data = await compute(categorySlug);

  if (categorySlug) {
    categoryCache.set(categorySlug, { data, expiresAt: now + TTL_MS });
  } else {
    cache = { data, expiresAt: now + TTL_MS };
  }
  return data;
}

export function clearStorageDashboardCache(categorySlug?: string) {
  if (categorySlug) {
    categoryCache.delete(categorySlug);
    rawCache.delete(categorySlug);
  } else {
    cache = null;
    categoryCache.clear();
    rawCache.clear();
  }
}
