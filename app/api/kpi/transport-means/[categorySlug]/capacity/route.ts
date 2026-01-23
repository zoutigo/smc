import { NextResponse } from "next/server";

import { getTransportCategoryCapacityKpis } from "@/lib/kpi/transport-category-capacity";

type RouteContext = { params: Promise<{ categorySlug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  try {
    const data = await getTransportCategoryCapacityKpis(params.categorySlug);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/kpi/transport-means/[categorySlug]/capacity] error", error);
    return NextResponse.json({ error: "Unable to load capacity KPIs" }, { status: 500 });
  }
}
