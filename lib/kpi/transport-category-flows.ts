import { getPrisma } from "@/lib/prisma";

export type TransportCategoryFlowsKpiResponse = {
  cards: {
    distinctFlows: number;
    monoFlow: number;
    multiFlow: number;
    withoutMainFlow: number;
    withoutPivot: number;
    topFlow?: { id: string; slug: string; count: number };
  };
  charts: {
    countByMainFlow: { flowId: string; slug: string; count: number }[];
    countByPivotFlow: { flowId: string; slug: string; count: number }[];
  };
};

export async function getTransportCategoryFlowsKpis(categorySlug: string): Promise<TransportCategoryFlowsKpiResponse> {
  const prisma = getPrisma();

  const transportMeans = await prisma.transportMean.findMany({
    where: { transportMeanCategory: { slug: categorySlug } },
    include: {
      flow: { select: { id: true, slug: true } },
      flows: { select: { flow: { select: { id: true, slug: true } } } },
    },
  });

  const pivotFlowCount = new Map<string, { slug: string; count: number }>();
  const mainFlowCount = new Map<string, { slug: string; count: number }>();
  const distinctFlowsSet = new Set<string>();

  let withoutMainFlow = 0;
  let withoutPivot = 0;
  let multiFlow = 0;
  let monoFlow = 0;

  transportMeans.forEach((tm) => {
    const pivotFlows = tm.flows.map((f) => f.flow).filter(Boolean) as { id: string; slug: string }[];
    if (!pivotFlows.length) withoutPivot += 1;
    if (!tm.flow) withoutMainFlow += 1;

    const totalFlows = new Set<string>();
    if (tm.flow) {
      totalFlows.add(tm.flow.id);
      mainFlowCount.set(tm.flow.id, {
        slug: tm.flow.slug,
        count: (mainFlowCount.get(tm.flow.id)?.count ?? 0) + 1,
      });
    }

    pivotFlows.forEach((f) => {
      totalFlows.add(f.id);
      pivotFlowCount.set(f.id, { slug: f.slug, count: (pivotFlowCount.get(f.id)?.count ?? 0) + 1 });
    });

    if (totalFlows.size > 1) multiFlow += 1;
    else monoFlow += 1;

    totalFlows.forEach((id) => distinctFlowsSet.add(id));
  });

  return {
    cards: {
      distinctFlows: distinctFlowsSet.size,
      monoFlow,
      multiFlow,
      withoutMainFlow,
      withoutPivot,
      topFlow: Array.from(pivotFlowCount.entries())
        .map(([id, value]) => ({ id, slug: value.slug, count: value.count }))
        .sort((a, b) => b.count - a.count)[0],
    },
    charts: {
      countByMainFlow: Array.from(mainFlowCount.entries()).map(([flowId, value]) => ({ flowId, slug: value.slug, count: value.count })),
      countByPivotFlow: Array.from(pivotFlowCount.entries()).map(([flowId, value]) => ({ flowId, slug: value.slug, count: value.count })),
    },
  };
}
