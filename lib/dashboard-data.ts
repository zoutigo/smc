import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import type { StorageDashboardData } from "@/lib/storage-dashboard-data";
import { getStorageDashboardData } from "@/lib/storage-dashboard-data";

type DashboardData = {
  plants: number;
  suppliers: number;
  flows: number;
  packagingMeans: number;
  storageMeans: number;
  transportMeans: number;
  totalPackagingValue: number;
  totalPackagingVolume: number;
  totalTransportCapacity: number;
  avgMaxSpeed: number;
  valueByPlant: Array<{ name: string; value: number }>;
  capacityByPlant: Array<{ name: string; value: number }>;
  packagingByCategory: Array<{ name: string; value: number }>;
  volumeByCategory: Array<{ name: string; value: number }>;
  storedPackagingQty: number;
  storedPackagingValue: number;
  overCapacityStorageMeans: number;
  storageOccupancyByPlant: Array<{ name: string; occupancyPct: number; qty: number; maxQty: number }>;
  topPackaging: Array<{
    id: string;
    name: string;
    plant: string;
    category: string;
    supplier: string;
    units: number;
    costFullUnit: number;
    totalValueFull: number;
  }>;
  topTransport: Array<{
    id: string;
    name: string;
    plant: string;
    category: string;
    supplier: string;
    units: number;
    loadCapacityKg: number;
    totalCapacityKg: number;
    maxSpeedKmh: number;
  }>;
};

const TTL_MS = 1000 * 60 * 5; // 5 minutes
let cache: { data: DashboardData; expiresAt: number } | null = null;

async function computeDashboardData(): Promise<DashboardData> {
  const start = Date.now();
  const prisma = getPrisma();

  let plants: Array<{ id: string }> = [];
  let suppliers: Array<{ id: string }> = [];
  let flows: Array<{ id: string }> = [];
  let packagingMeans: Prisma.PackagingMeanGetPayload<{
    select: {
      id: true;
      name: true;
      price: true;
      width: true;
      length: true;
      height: true;
      numberOfPackagings: true;
      status: true;
      plant: { select: { name: true } };
      packagingMeanCategory: { select: { name: true } };
      supplier: { select: { name: true } };
      accessories: { select: { qtyPerPackaging: true; unitPriceOverride: true; accessory: { select: { unitPrice: true } } } };
    };
  }>[] = [];
  let storageMeansCount = 0;
  let transportMeans: Prisma.TransportMeanGetPayload<{
    select: { id: true; name: true; plant: { select: { name: true } }; transportMeanCategory: { select: { name: true } }; supplier: { select: { name: true } }; units: true; loadCapacityKg: true; maxSpeedKmh: true };
  }>[] = [];
  let storageDashboard: StorageDashboardData | null = null;

  try {
    [plants, suppliers, flows, packagingMeans, storageMeansCount, transportMeans, storageDashboard] = await Promise.all([
      prisma.plant.findMany({ select: { id: true } }),
      prisma.supplier.findMany({ select: { id: true } }),
      prisma.flow.findMany({ select: { id: true } }),
      prisma.packagingMean.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          width: true,
          length: true,
          height: true,
          numberOfPackagings: true,
          status: true,
          plant: { select: { name: true } },
          packagingMeanCategory: { select: { name: true } },
          supplier: { select: { name: true } },
          accessories: { select: { qtyPerPackaging: true, unitPriceOverride: true, accessory: { select: { unitPrice: true } } } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.storageMean.count(),
      prisma.transportMean.findMany({
        select: {
          id: true,
          name: true,
          units: true,
          loadCapacityKg: true,
          maxSpeedKmh: true,
          plant: { select: { name: true } },
          transportMeanCategory: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      getStorageDashboardData(),
    ]);
  } catch (err) {
    console.error("[computeDashboardData] failed to load from DB, returning empty cache", err);
    return {
      plants: 0,
      suppliers: 0,
      flows: 0,
      packagingMeans: 0,
      storageMeans: 0,
      transportMeans: 0,
      totalPackagingValue: 0,
      totalPackagingVolume: 0,
      totalTransportCapacity: 0,
      avgMaxSpeed: 0,
      valueByPlant: [],
      capacityByPlant: [],
      packagingByCategory: [],
      volumeByCategory: [],
      storedPackagingQty: 0,
      storedPackagingValue: 0,
      overCapacityStorageMeans: 0,
      storageOccupancyByPlant: [],
      topPackaging: [],
      topTransport: [],
    };
  }

  const packagingTotals = packagingMeans.map((pm) => {
    const accessoryCostUnit = pm.accessories.reduce((acc, link) => {
      const unit = link.unitPriceOverride ?? link.accessory?.unitPrice ?? 0;
      return acc + unit * link.qtyPerPackaging;
    }, 0);
    const fullUnit = pm.price + accessoryCostUnit;
    const totalFull = fullUnit * pm.numberOfPackagings;
    const volumeM3 = (pm.width * pm.length * pm.height * pm.numberOfPackagings) / 1_000_000_000;
    return {
      id: pm.id,
      name: pm.name,
      plant: pm.plant?.name ?? "Unknown",
      category: pm.packagingMeanCategory?.name ?? "Uncategorized",
      supplier: pm.supplier?.name ?? "Unknown",
      units: pm.numberOfPackagings,
      costFullUnit: fullUnit,
      totalValueFull: totalFull,
      volumeM3,
    };
  });

  const transportTotals = transportMeans.map((tm) => {
    const totalCapacityKg = tm.loadCapacityKg * tm.units;
    return {
      id: tm.id,
      name: tm.name,
      plant: tm.plant?.name ?? "Unknown",
      category: tm.transportMeanCategory?.name ?? "Uncategorized",
      supplier: tm.supplier?.name ?? "Unknown",
      units: tm.units,
      loadCapacityKg: tm.loadCapacityKg,
      totalCapacityKg,
      maxSpeedKmh: tm.maxSpeedKmh,
    };
  });

  const valueByPlantMap = new Map<string, number>();
  packagingTotals.forEach((pm) => valueByPlantMap.set(pm.plant, (valueByPlantMap.get(pm.plant) ?? 0) + pm.totalValueFull));
  const valueByPlant = Array.from(valueByPlantMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const capacityByPlantMap = new Map<string, number>();
  transportTotals.forEach((tm) => capacityByPlantMap.set(tm.plant, (capacityByPlantMap.get(tm.plant) ?? 0) + tm.totalCapacityKg));
  const capacityByPlant = Array.from(capacityByPlantMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const packagingByCategoryMap = new Map<string, number>();
  packagingTotals.forEach((pm) => packagingByCategoryMap.set(pm.category, (packagingByCategoryMap.get(pm.category) ?? 0) + 1));
  const packagingByCategory = Array.from(packagingByCategoryMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const volumeByCategoryMap = new Map<string, number>();
  packagingTotals.forEach((pm) => volumeByCategoryMap.set(pm.category, (volumeByCategoryMap.get(pm.category) ?? 0) + pm.volumeM3));
  const volumeByCategory = Array.from(volumeByCategoryMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const totalPackagingValue = packagingTotals.reduce((sum, pm) => sum + pm.totalValueFull, 0);
  const totalPackagingVolume = packagingTotals.reduce((sum, pm) => sum + pm.volumeM3, 0);
  const totalTransportCapacity = transportTotals.reduce((sum, tm) => sum + tm.totalCapacityKg, 0);
  const avgMaxSpeed = transportTotals.length ? transportTotals.reduce((sum, tm) => sum + tm.maxSpeedKmh, 0) / transportTotals.length : 0;

  const topPackaging = packagingTotals.slice().sort((a, b) => b.totalValueFull - a.totalValueFull).slice(0, 10);
  const topTransport = transportTotals.slice().sort((a, b) => b.totalCapacityKg - a.totalCapacityKg).slice(0, 10);

  const result: DashboardData = {
    plants: plants.length,
    suppliers: suppliers.length,
    flows: flows.length,
    packagingMeans: packagingMeans.length,
    storageMeans: storageMeansCount,
    transportMeans: transportMeans.length,
    totalPackagingValue,
    totalPackagingVolume,
    totalTransportCapacity,
    avgMaxSpeed,
    valueByPlant,
    capacityByPlant,
    packagingByCategory,
    volumeByCategory,
    storedPackagingQty: storageDashboard?.occupancyCards.totalQty ?? 0,
    storedPackagingValue: storageDashboard?.occupancyCards.totalValue ?? 0,
    overCapacityStorageMeans: storageDashboard?.occupancyCards.overCapacityCount ?? 0,
    storageOccupancyByPlant: storageDashboard?.occupancyByPlant ?? [],
    topPackaging,
    topTransport,
  };

  if (process.env.DASHBOARD_DEBUG) {
    console.debug?.("[dashboard-data] duration(ms)", Date.now() - start);
  }
  return result;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  const data = await computeDashboardData();
  cache = { data, expiresAt: now + TTL_MS };
  return data;
}

export function clearDashboardCache() {
  cache = null;
}
