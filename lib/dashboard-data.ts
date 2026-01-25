import { getPrisma } from "@/lib/prisma";

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
  const prisma = getPrisma();

  const [plants, suppliers, flows, packagingMeans, storageMeansCount, transportMeans] = await Promise.all([
    prisma.plant.findMany({ select: { id: true, name: true } }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.flow.findMany({ select: { id: true, slug: true } }),
    prisma.packagingMean.findMany({
      include: {
        plant: true,
        packagingMeanCategory: true,
        supplier: true,
        accessories: { include: { accessory: true } },
      },
    }),
    prisma.storageMean.count(),
    prisma.transportMean.findMany({ include: { plant: true, transportMeanCategory: true, supplier: true } }),
  ]);

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

  return {
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
    topPackaging,
    topTransport,
  };
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
