import { NextResponse } from "next/server";

import { getTransportCategoryFlowsKpis } from "@/lib/kpi/transport-category-flows";

type RouteContext = { params: Promise<{ categorySlug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  try {
    const data = await getTransportCategoryFlowsKpis(params.categorySlug);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/kpi/transport-means/[categorySlug]/flows] error", error);
    return NextResponse.json({ error: "Unable to load flow KPIs" }, { status: 500 });
  }
}
