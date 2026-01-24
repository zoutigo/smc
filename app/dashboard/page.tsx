import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Global dashboard",
  description: "Global KPIs for plants, suppliers, packaging, storage, and transport means.",
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const prisma = getPrisma();

  let plants: { id: string; name: string }[] = [];
  let suppliers: { id: string; name: string }[] = [];
  let flows: { id: string; slug: string }[] = [];
  let packagingMeans: Prisma.PackagingMeanGetPayload<{
    include: {
      plant: true;
      packagingMeanCategory: true;
      supplier: true;
      accessories: { include: { accessory: true } };
    };
  }>[] = [];
  let storageMeansCount = 0;
  let transportMeans: Prisma.TransportMeanGetPayload<{
    include: { plant: true; transportMeanCategory: true; supplier: true };
  }>[] = [];

  try {
    [plants, suppliers, flows, packagingMeans, storageMeansCount, transportMeans] = await Promise.all([
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
      prisma.transportMean.findMany({
        include: { plant: true, transportMeanCategory: true, supplier: true },
      }),
    ]);
  } catch (err) {
    console.error("Dashboard data load failed, falling back to empty data", err);
  }

  const packagingTotals = packagingMeans.map((pm) => {
    const accessoryCostUnit = pm.accessories.reduce((acc, link) => {
      const unit = link.unitPriceOverride ?? link.accessory?.unitPrice ?? 0;
      return acc + unit * link.qtyPerPackaging;
    }, 0);
    const fullUnit = pm.price + accessoryCostUnit;
    const totalFull = fullUnit * pm.numberOfPackagings;
    const volumeM3 = (pm.width * pm.length * pm.height * pm.numberOfPackagings) / 1_000_000_000; // assume mm -> m^3
    return {
      id: pm.id,
      name: pm.name,
      plant: pm.plant?.name ?? "Unknown",
      category: pm.packagingMeanCategory?.name ?? "Uncategorized",
      supplier: pm.supplier?.name ?? "Unknown",
      units: pm.numberOfPackagings,
      costFullUnit: fullUnit,
      totalFull,
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
  packagingTotals.forEach((pm) => valueByPlantMap.set(pm.plant, (valueByPlantMap.get(pm.plant) ?? 0) + pm.totalFull));
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

  const totalPackagingValue = packagingTotals.reduce((sum, pm) => sum + pm.totalFull, 0);
  const totalPackagingVolume = packagingTotals.reduce((sum, pm) => sum + pm.volumeM3, 0);
  const totalTransportCapacity = transportTotals.reduce((sum, tm) => sum + tm.totalCapacityKg, 0);
  const avgMaxSpeed = transportTotals.length ? transportTotals.reduce((sum, tm) => sum + tm.maxSpeedKmh, 0) / transportTotals.length : 0;

  const metrics = [
    { label: "Plants", value: plants.length.toString(), helper: `${suppliers.length} suppliers • ${flows.length} flows` },
    { label: "Packaging means", value: packagingMeans.length.toString(), helper: `Volume ${totalPackagingVolume.toFixed(1)} m³` },
    { label: "Storage means", value: storageMeansCount.toString() },
    { label: "Transport means", value: transportMeans.length.toString(), helper: `Avg max speed ${avgMaxSpeed.toFixed(1)} km/h` },
    { label: "Packaging fleet value", value: currency.format(totalPackagingValue || 0) },
    { label: "Transport capacity (kg)", value: totalTransportCapacity.toLocaleString("en-US") },
  ];

  const topPackaging = packagingTotals
    .slice()
    .sort((a, b) => b.totalFull - a.totalFull)
    .slice(0, 10)
    .map((row) => ({
      ...row,
      totalValueFull: row.totalFull,
    }));

  const topTransport = transportTotals
    .slice()
    .sort((a, b) => b.totalCapacityKg - a.totalCapacityKg)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <DashboardClient
        metrics={metrics}
        valueByPlant={valueByPlant}
        capacityByPlant={capacityByPlant}
        packagingByCategory={packagingByCategory}
        volumeByCategory={volumeByCategory}
        topPackaging={topPackaging}
        topTransport={topTransport}
      />
    </main>
  );
}
