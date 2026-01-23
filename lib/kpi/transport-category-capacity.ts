import { getPrisma } from "@/lib/prisma";

export type TransportCategoryCapacityKpiResponse = {
  cards: {
    totalLoadKg: number;
    avgLoadKg: number;
    avgCruiseSpeed: number;
    avgMaxSpeed: number;
    speedSpread: number;
    outliers: number;
  };
  charts: {
    scatter: { id: string; name: string; loadCapacityKg: number; maxSpeedKmh: number }[];
    avgLoadByPlant: { plantId: string; plantName: string; avgLoad: number }[];
    speedHistogram: { bucket: string; count: number }[];
  };
};

export async function getTransportCategoryCapacityKpis(categorySlug: string): Promise<TransportCategoryCapacityKpiResponse> {
  const prisma = getPrisma();
  const items = await prisma.transportMean.findMany({
    where: { transportMeanCategory: { slug: categorySlug } },
    include: { plant: { select: { id: true, name: true } } },
  });

  const cards: TransportCategoryCapacityKpiResponse["cards"] = {
    totalLoadKg: items.reduce((sum, tm) => sum + tm.loadCapacityKg * tm.units, 0),
    avgLoadKg: items.reduce((sum, tm) => sum + tm.loadCapacityKg, 0) / (items.length || 1),
    avgCruiseSpeed: items.reduce((sum, tm) => sum + tm.cruiseSpeedKmh, 0) / (items.length || 1),
    avgMaxSpeed: items.reduce((sum, tm) => sum + tm.maxSpeedKmh, 0) / (items.length || 1),
    speedSpread:
      items.length > 1
        ? Math.max(...items.map((tm) => tm.maxSpeedKmh)) - Math.min(...items.map((tm) => tm.maxSpeedKmh))
        : 0,
    outliers: items.filter((tm) => tm.loadCapacityKg === 0 || tm.maxSpeedKmh === 0).length,
  };

  const scatter = items.map((tm) => ({
    id: tm.id,
    name: tm.name,
    loadCapacityKg: tm.loadCapacityKg,
    maxSpeedKmh: tm.maxSpeedKmh,
  }));

  const avgLoadByPlantMap = new Map<string, { plantName: string; total: number; count: number }>();
  items.forEach((tm) => {
    if (!tm.plant) return;
    const current = avgLoadByPlantMap.get(tm.plant.id) ?? { plantName: tm.plant.name, total: 0, count: 0 };
    avgLoadByPlantMap.set(tm.plant.id, {
      plantName: current.plantName,
      total: current.total + tm.loadCapacityKg,
      count: current.count + 1,
    });
  });

  const avgLoadByPlant = Array.from(avgLoadByPlantMap.entries()).map(([plantId, value]) => ({
    plantId,
    plantName: value.plantName,
    avgLoad: value.total / value.count,
  }));

  const histogramBuckets = [0, 100, 250, 500, 750, 1000, 2000];
  const speedHistogramCounts: Record<string, number> = {};
  histogramBuckets.forEach((b) => (speedHistogramCounts[`≤ ${b} km/h`] = 0));
  speedHistogramCounts["> 2000 km/h"] = 0;
  items.forEach((tm) => {
    const speed = tm.maxSpeedKmh;
    const bucket = histogramBuckets.find((b) => speed <= b);
    if (bucket !== undefined) speedHistogramCounts[`≤ ${bucket} km/h`] += 1;
    else speedHistogramCounts["> 2000 km/h"] += 1;
  });

  return {
    cards,
    charts: {
      scatter,
      avgLoadByPlant,
      speedHistogram: Object.entries(speedHistogramCounts).map(([bucket, count]) => ({ bucket, count })),
    },
  };
}
