import { getPrisma } from "@/lib/prisma";

export type TransportCategoryPackagingKpiResponse = {
  cards: {
    packagingDistinct: number;
    topPackaging?: { id: string; name: string; count: number };
    avgMaxQty: number;
    withPartLinkPct: number;
    zeroQtyLinks: number;
  };
  charts: {
    topPackaging: { id: string; name: string; count: number }[];
    topCapacity: { transportMeanId: string; transportMeanName: string; capacity: number }[];
    partLinkDonut: { label: string; count: number }[];
  };
  table: { transportMean: string; packagingMean: string; maxQty: number; notes?: string | null }[];
};

export async function getTransportCategoryPackagingKpis(categorySlug: string): Promise<TransportCategoryPackagingKpiResponse> {
  const prisma = getPrisma();

  const links = await prisma.transportMeanPackagingMean.findMany({
    where: { transportMean: { transportMeanCategory: { slug: categorySlug } } },
    include: {
      transportMean: { select: { id: true, name: true } },
      packagingMean: { select: { id: true, name: true } },
      packagingMeanPart: true,
    },
  });

  const packagingCountMap = new Map<string, { name: string; count: number }>();
  const capacityByTmMap = new Map<string, { name: string; capacity: number }>();

  let totalMaxQty = 0;
  let withPartLink = 0;
  let zeroQtyLinks = 0;

  links.forEach((link) => {
    packagingCountMap.set(link.packagingMeanId, {
      name: link.packagingMean?.name ?? "Unknown",
      count: (packagingCountMap.get(link.packagingMeanId)?.count ?? 0) + 1,
    });

    capacityByTmMap.set(link.transportMeanId, {
      name: link.transportMean?.name ?? "Unknown",
      capacity: (capacityByTmMap.get(link.transportMeanId)?.capacity ?? 0) + link.maxQty,
    });

    totalMaxQty += link.maxQty;
    if (link.packagingMeanPart) withPartLink += 1;
    if (link.maxQty <= 0) zeroQtyLinks += 1;
  });

  const packagingDistinct = packagingCountMap.size;
  const topPackagingArray = Array.from(packagingCountMap.entries())
    .map(([id, value]) => ({ id, name: value.name, count: value.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const topCapacity = Array.from(capacityByTmMap.entries())
    .map(([id, value]) => ({ transportMeanId: id, transportMeanName: value.name, capacity: value.capacity }))
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 10);

  const totalLinks = links.length || 1;

  return {
    cards: {
      packagingDistinct,
      topPackaging: topPackagingArray[0],
      avgMaxQty: totalMaxQty / totalLinks,
      withPartLinkPct: (withPartLink / totalLinks) * 100,
      zeroQtyLinks,
    },
    charts: {
      topPackaging: topPackagingArray,
      topCapacity,
      partLinkDonut: [
        { label: "With part link", count: withPartLink },
        { label: "Without part link", count: totalLinks - withPartLink },
      ],
    },
    table: links.map((link) => ({
      transportMean: link.transportMean?.name ?? "—",
      packagingMean: link.packagingMean?.name ?? "—",
      maxQty: link.maxQty,
      notes: link.notes,
    })),
  };
}
