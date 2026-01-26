import { DashboardClient } from "./dashboard-client";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Global dashboard",
  description: "Global KPIs for plants, suppliers, packaging, storage, and transport means.",
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const {
    plants,
    suppliers,
    flows,
    packagingMeans,
    storageMeans,
    transportMeans,
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
  storedPackagingQty,
  storedPackagingValue,
  overCapacityStorageMeans,
  storageOccupancyByPlant,
} = await getDashboardData();

  const metrics = [
    { label: "Plants", value: plants.toString(), helper: `${suppliers} suppliers • ${flows} flows` },
    { label: "Packaging means", value: packagingMeans.toString(), helper: `Volume ${totalPackagingVolume.toFixed(1)} m³` },
    { label: "Storage means", value: storageMeans.toString() },
    { label: "Transport means", value: transportMeans.toString(), helper: `Avg max speed ${avgMaxSpeed.toFixed(1)} km/h` },
    { label: "Packaging fleet value", value: currency.format(totalPackagingValue || 0) },
    { label: "Transport capacity (kg)", value: totalTransportCapacity.toLocaleString("en-US") },
    { label: "Stored packaging qty", value: storedPackagingQty.toLocaleString("en-US") },
    { label: "Stored packaging value", value: currency.format(storedPackagingValue || 0) },
    { label: "Storage over capacity", value: overCapacityStorageMeans.toString(), helper: "qty > maxQty" },
  ];

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <DashboardClient
        metrics={metrics}
        valueByPlant={valueByPlant}
        capacityByPlant={capacityByPlant}
        packagingByCategory={packagingByCategory}
        volumeByCategory={volumeByCategory}
        storageOccupancyByPlant={storageOccupancyByPlant}
        topPackaging={topPackaging}
        topTransport={topTransport}
      />
    </main>
  );
}
