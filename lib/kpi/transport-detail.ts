import { getPrisma } from "@/lib/prisma";

export type TransportDetailKpi = {
  id: string;
  name: string;
  categoryName?: string | null;
  plantName?: string | null;
  supplierName?: string | null;
  units: number;
  loadCapacityKg: number;
  cruiseSpeedKmh: number;
  maxSpeedKmh: number;
  packagingCount: number;
  flowsCount: number;
  flowSlug?: string | null;
  packagingLinks: Array<{ packagingMean: string; maxQty: number; notes?: string | null }>;
  flows: Array<{ slug: string }>;
  images: Array<{ url: string }>;
};

export async function getTransportDetailKpi(transportMeanId: string): Promise<TransportDetailKpi | null> {
  const prisma = getPrisma();
  const tm = await prisma.transportMean.findUnique({
    where: { id: transportMeanId },
    include: {
      transportMeanCategory: { select: { name: true, slug: true } },
      plant: { select: { name: true } },
      supplier: { select: { name: true } },
      flows: { select: { flow: { select: { slug: true } } } },
      packagingLinks: { include: { packagingMean: { select: { name: true } } } },
      images: { include: { image: { select: { imageUrl: true } } }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!tm) return null;

  return {
    id: tm.id,
    name: tm.name,
    categoryName: tm.transportMeanCategory?.name,
    plantName: tm.plant?.name,
    supplierName: tm.supplier?.name,
    units: tm.units,
    loadCapacityKg: tm.loadCapacityKg,
    cruiseSpeedKmh: tm.cruiseSpeedKmh,
    maxSpeedKmh: tm.maxSpeedKmh,
    packagingCount: new Set(tm.packagingLinks.map((l) => l.packagingMeanId)).size,
    flowsCount: new Set(tm.flows.map((f) => f.flow?.slug).filter((slug): slug is string => Boolean(slug))).size,
    flowSlug: tm.flows.find((f) => f.flow?.slug)?.flow?.slug ?? null,
    packagingLinks: tm.packagingLinks.map((l) => ({
      packagingMean: l.packagingMean?.name ?? "—",
      maxQty: l.maxQty,
      notes: l.notes,
    })),
    flows: tm.flows.map((f) => ({ slug: f.flow?.slug ?? "—" })),
    images: tm.images.map((img) => ({ url: img.image?.imageUrl ?? "" })),
  };
}
