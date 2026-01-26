import { Prisma } from "@prisma/client";

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
  select: {
    id: true;
    name: true;
    price: true;
    usefulSurfaceM2: true;
    grossSurfaceM2: true;
    plantId: true;
    plant: { select: { id: true; name: true } };
    storageMeanCategoryId: true;
    storageMeanCategory: { select: { id: true; name: true; slug: true } };
    staffingLines: true;
    laneGroups: { select: { id: true; name: true; description: true; lanes: { select: { id: true; lengthMm: true; widthMm: true; heightMm: true; numberOfLanes: true; level: true; laneType: true } } } };
    packagingLinks: {
      select: {
        packagingMeanId: true;
        qty: true;
        maxQty: true;
        notes: true;
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
const MAX_STORAGE_ITEMS = 200;

const toNumber = (val: Prisma.Decimal | number | null | undefined) => {
  if (val === null || val === undefined) return 0;
  // Prisma Decimal has toNumber
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyVal: any = val;
  if (typeof anyVal.toNumber === "function") return anyVal.toNumber();
  return Number(val) || 0;
};

function buildCategoryWhere(categorySlug?: string) {
  if (!categorySlug) return Prisma.empty;
  return Prisma.sql`WHERE smc.slug = ${categorySlug}`;
}

type OccupancyAgg = {
  totalQty: number;
  totalMaxQty: number;
  totalValue: number;
  configuredCount: number;
  overCapacityCount: number;
  distinctPackaging: number;
  slotsRemaining: number;
};

type PlantAgg = { name: string; qty: number; maxQty: number; value: number };
type LaneAggRow = { name: string | null; laneGroups: bigint | number | null; lanes: bigint | number | null };
type StaffAggRow = { name: string | null; workforce: bigint | number | null };

async function getLaneAndStaffAggregates(categorySlug?: string): Promise<{
  laneByPlant: Array<{ name: string; laneGroups: number; lanes: number }>;
  workforceByPlant: Array<{ name: string; workforce: number }>;
  totals: { laneGroups: number; lanes: number; workforce: number };
}> {
  const prisma = getPrisma();
  const whereClause = buildCategoryWhere(categorySlug);

  const [laneRows, staffRows, laneTotalsRow, staffTotalRow] = await Promise.all([
    prisma.$queryRaw<LaneAggRow[]>(Prisma.sql`
      SELECT
        COALESCE(p.name, 'Unknown') AS name,
        COUNT(DISTINCT lg.id)       AS laneGroups,
        COALESCE(SUM(COALESCE(l.numberOfLanes, 0)), 0) AS lanes
      FROM StorageMean sm
      JOIN StorageMeanCategory smc ON smc.id = sm.storageMeanCategoryId
      LEFT JOIN Plant p ON p.id = sm.plantId
      LEFT JOIN LaneGroup lg ON lg.storageMeanId = sm.id
      LEFT JOIN Lane l ON l.laneGroupId = lg.id
      ${whereClause}
      GROUP BY p.name
    `),
    prisma.$queryRaw<StaffAggRow[]>(Prisma.sql`
      SELECT
        COALESCE(p.name, 'Unknown') AS name,
        COALESCE(SUM(COALESCE(sl.qty, 0)), 0) AS workforce
      FROM StorageMean sm
      JOIN StorageMeanCategory smc ON smc.id = sm.storageMeanCategoryId
      LEFT JOIN Plant p ON p.id = sm.plantId
      LEFT JOIN StaffingLine sl ON sl.storageMeanId = sm.id
      ${whereClause}
      GROUP BY p.name
    `),
    prisma.$queryRaw<Array<{ laneGroups: bigint | number | null; lanes: bigint | number | null }>>(Prisma.sql`
      SELECT
        COUNT(DISTINCT lg.id) AS laneGroups,
        COALESCE(SUM(COALESCE(l.numberOfLanes, 0)), 0) AS lanes
      FROM StorageMean sm
      JOIN StorageMeanCategory smc ON smc.id = sm.storageMeanCategoryId
      LEFT JOIN LaneGroup lg ON lg.storageMeanId = sm.id
      LEFT JOIN Lane l ON l.laneGroupId = lg.id
      ${whereClause}
    `),
    prisma.$queryRaw<Array<{ workforce: bigint | number | null }>>(Prisma.sql`
      SELECT COALESCE(SUM(COALESCE(sl.qty, 0)), 0) AS workforce
      FROM StorageMean sm
      JOIN StorageMeanCategory smc ON smc.id = sm.storageMeanCategoryId
      LEFT JOIN StaffingLine sl ON sl.storageMeanId = sm.id
      ${whereClause}
    `),
  ]);

  const laneByPlant = laneRows.map((row) => ({
    name: row.name ?? "Unknown",
    laneGroups: Number(row.laneGroups ?? 0),
    lanes: Number(row.lanes ?? 0),
  }));

  const workforceByPlant = staffRows.map((row) => ({
    name: row.name ?? "Unknown",
    workforce: Number(row.workforce ?? 0),
  }));

  return {
    laneByPlant,
    workforceByPlant,
    totals: {
      laneGroups: Number(laneTotalsRow[0]?.laneGroups ?? 0),
      lanes: Number(laneTotalsRow[0]?.lanes ?? 0),
      workforce: Number(staffTotalRow[0]?.workforce ?? 0),
    },
  };
}

async function getOccupancyAggregates(categorySlug?: string): Promise<{ cards: OccupancyAgg; byPlant: PlantAgg[] }> {
  const prisma = getPrisma();
  const whereClause = buildCategoryWhere(categorySlug);

  const [cardRows, plantRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        totalQty: bigint | number | null;
        totalMaxQty: bigint | number | null;
        totalValue: bigint | number | null;
        configuredCount: bigint | number | null;
        overCapacityCount: bigint | number | null;
        distinctPackaging: bigint | number | null;
        slotsRemaining: bigint | number | null;
      }>
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(smpm.qty), 0)                                    AS totalQty,
        COALESCE(SUM(COALESCE(smpm.maxQty, 0)), 0)                    AS totalMaxQty,
        COALESCE(SUM(smpm.qty * COALESCE(pm.price, 0)), 0)            AS totalValue,
        COUNT(DISTINCT CASE WHEN smpm.maxQty IS NOT NULL THEN sm.id END) AS configuredCount,
        COUNT(DISTINCT CASE WHEN smpm.maxQty IS NOT NULL AND smpm.qty > smpm.maxQty THEN sm.id END) AS overCapacityCount,
        COUNT(DISTINCT smpm.packagingMeanId)                          AS distinctPackaging,
        COALESCE(SUM(CASE WHEN smpm.maxQty IS NOT NULL THEN smpm.maxQty - smpm.qty ELSE 0 END), 0) AS slotsRemaining
      FROM StorageMean sm
      JOIN StorageMeanCategory smc ON smc.id = sm.storageMeanCategoryId
      JOIN StorageMeanPackagingMean smpm ON smpm.storageMeanId = sm.id
      LEFT JOIN PackagingMean pm ON pm.id = smpm.packagingMeanId
      ${whereClause}
    `),
    prisma.$queryRaw<
      Array<{
        name: string | null;
        qty: bigint | number | null;
        maxQty: bigint | number | null;
        value: bigint | number | null;
      }>
    >(Prisma.sql`
      SELECT
        COALESCE(p.name, 'Unknown') AS name,
        COALESCE(SUM(smpm.qty), 0) AS qty,
        COALESCE(SUM(COALESCE(smpm.maxQty, 0)), 0) AS maxQty,
        COALESCE(SUM(smpm.qty * COALESCE(pm.price, 0)), 0) AS value
      FROM StorageMean sm
      JOIN StorageMeanCategory smc ON smc.id = sm.storageMeanCategoryId
      LEFT JOIN Plant p ON p.id = sm.plantId
      JOIN StorageMeanPackagingMean smpm ON smpm.storageMeanId = sm.id
      LEFT JOIN PackagingMean pm ON pm.id = smpm.packagingMeanId
      ${whereClause}
      GROUP BY p.name
    `),
  ]);

  const first = cardRows[0];
  return {
    cards: {
      totalQty: Number(first?.totalQty ?? 0),
      totalMaxQty: Number(first?.totalMaxQty ?? 0),
      totalValue: Number(first?.totalValue ?? 0),
      configuredCount: Number(first?.configuredCount ?? 0),
      overCapacityCount: Number(first?.overCapacityCount ?? 0),
      distinctPackaging: Number(first?.distinctPackaging ?? 0),
      slotsRemaining: Number(first?.slotsRemaining ?? 0),
    },
    byPlant: plantRows.map((row) => ({
      name: row.name ?? "Unknown",
      qty: Number(row.qty ?? 0),
      maxQty: Number(row.maxQty ?? 0),
      value: Number(row.value ?? 0),
    })),
  };
}

export async function getStorageMeansWithRelations(categorySlug?: string): Promise<StorageMeanWithRelations[]> {
  const now = Date.now();
  const cacheKey = categorySlug ?? "__all__";
  const entry = rawCache.get(cacheKey);
  if (entry && entry.expiresAt > now) return entry.data;

  const prisma = getPrisma();
  let data: StorageMeanWithRelations[] = [];
  try {
    data = await prisma.storageMean.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        usefulSurfaceM2: true,
        grossSurfaceM2: true,
        plantId: true,
        plant: { select: { id: true, name: true } },
        storageMeanCategoryId: true,
        storageMeanCategory: { select: { id: true, name: true, slug: true } },
        staffingLines: true,
        laneGroups: { select: { id: true, name: true, description: true, lanes: { select: { id: true, lengthMm: true, widthMm: true, heightMm: true, numberOfLanes: true, level: true, laneType: true } } } },
        packagingLinks: {
          select: {
            packagingMeanId: true,
            qty: true,
            maxQty: true,
            notes: true,
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
      orderBy: { updatedAt: "desc" },
      take: MAX_STORAGE_ITEMS,
    });
  } catch (err) {
    console.error("[storage-dashboard] failed to load storage means", err);
    return [];
  }

  rawCache.set(cacheKey, { data, expiresAt: now + TTL_MS });
  return data;
}

async function compute(categorySlug?: string): Promise<StorageDashboardData> {
  const start = Date.now();
  try {
    const [storageMeans, occupancyAgg, laneStaffAgg] = await Promise.all([
      getStorageMeansWithRelations(categorySlug),
      getOccupancyAggregates(categorySlug).catch((err) => {
        console.error("[storage-dashboard] occupancy aggregates failed, fallback to in-memory", err);
        return null;
      }),
      getLaneAndStaffAggregates(categorySlug).catch((err) => {
        console.error("[storage-dashboard] lane/staff aggregates failed, fallback to in-memory", err);
        return null;
      }),
    ]);

    const categories = new Set(storageMeans.map((sm) => sm.storageMeanCategory?.name ?? "Uncategorized"));
    const plants = new Set(storageMeans.map((sm) => sm.plant?.name ?? "Unknown"));

    const totalUseful = storageMeans.reduce((sum, sm) => sum + toNumber(sm.usefulSurfaceM2), 0);
    const totalGross = storageMeans.reduce((sum, sm) => sum + toNumber(sm.grossSurfaceM2), 0);
    const efficiencyPct = totalGross > 0 ? (totalUseful / totalGross) * 100 : 0;
    const totalValue = storageMeans.reduce((sum, sm) => sum + sm.price, 0);

    const totalLaneGroups =
      laneStaffAgg?.totals.laneGroups ??
      storageMeans.reduce((sum, sm) => sum + sm.laneGroups.length, 0);
    const totalLanes =
      laneStaffAgg?.totals.lanes ??
      storageMeans.reduce(
        (sum, sm) =>
          sum +
          sm.laneGroups.reduce((lgSum, lg) => lgSum + lg.lanes.reduce((lSum, l) => lSum + (l.numberOfLanes ?? 0), 0), 0),
        0,
      );

    const totalWorkforce =
      laneStaffAgg?.totals.workforce ??
      storageMeans.reduce(
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

    const workforceByPlant =
      laneStaffAgg?.workforceByPlant
        .map((row) => ({ name: row.name, value: row.workforce }))
        .sort((a, b) => b.value - a.value) ??
      Array.from(
        storageMeans.reduce((map, sm) => {
          const plantName = sm.plant?.name ?? "Unknown";
          const qty = sm.staffingLines.reduce((acc, line) => acc + toNumber(line.qty), 0);
          map.set(plantName, (map.get(plantName) ?? 0) + qty);
          return map;
        }, new Map<string, number>()),
        ([name, value]) => ({ name, value }),
      ).sort((a, b) => b.value - a.value);

    const lanesByPlant =
      laneStaffAgg?.laneByPlant
        .map((row) => ({ name: row.name, value: row.lanes }))
        .sort((a, b) => b.value - a.value) ??
      Array.from(
        storageMeans.reduce((map, sm) => {
          const plantName = sm.plant?.name ?? "Unknown";
          const lanes = sm.laneGroups.reduce((acc, lg) => acc + lg.lanes.reduce((lAcc, l) => lAcc + (l.numberOfLanes ?? 0), 0), 0);
          map.set(plantName, (map.get(plantName) ?? 0) + lanes);
          return map;
        }, new Map<string, number>()),
        ([name, value]) => ({ name, value }),
      ).sort((a, b) => b.value - a.value);

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

    // Occupancy & value (prefer DB aggregates, fallback to in-memory)
    const occupancyByPlantMap = new Map<string, { qty: number; maxQty: number; value: number }>();
    let totalQty = occupancyAgg?.cards.totalQty ?? 0;
    let totalMaxQty = occupancyAgg?.cards.totalMaxQty ?? 0;
    let totalValueStored = occupancyAgg?.cards.totalValue ?? 0;
    let overCapacityCount = occupancyAgg?.cards.overCapacityCount ?? 0;
    let configuredCount = occupancyAgg?.cards.configuredCount ?? 0;
    let slotsRemaining = occupancyAgg?.cards.slotsRemaining ?? 0;
    const storageTable: StorageDashboardData["storageTable"] = [];
    const packagingSet = new Set<string>();
    const packagingAgg = new Map<string, { name: string; qty: number; value: number }>();

    // If aggregate by plant available, seed map from it; still compute per-storage table from limited dataset
    occupancyAgg?.byPlant.forEach((row) => {
      occupancyByPlantMap.set(row.name, { qty: row.qty, maxQty: row.maxQty, value: row.value });
    });

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

      // Only recompute totals if aggregates were not already computed (keeps DB result authoritative)
      if (!occupancyAgg) {
        totalQty += qty;
        totalMaxQty += maxQty;
        totalValueStored += value;
        if (maxQty > 0) {
          configuredCount += 1;
          slotsRemaining += maxQty - qty;
        }
        if (maxQty > 0 && qty > maxQty) overCapacityCount += 1;
      }

      const plantEntry = occupancyByPlantMap.get(plantName) ?? { qty: 0, maxQty: 0, value: 0 };
      // Always keep per-storage contributions so limited list still reflects table data
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

    const result = {
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
      storageOccupancyDetail: storageOccupancyDetail.slice(0, 200),
      topStoredPackaging,
    };
    if (process.env.DASHBOARD_DEBUG) {
      console.debug?.("[storage-dashboard] compute duration(ms)", Date.now() - start, "slug", categorySlug ?? "all");
    }
    return result;
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
