import { NextResponse } from "next/server";

import { getTransportCategoryPackagingKpis } from "@/lib/kpi/transport-category-packaging";

type RouteContext = { params: Promise<{ categorySlug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  try {
    const data = await getTransportCategoryPackagingKpis(params.categorySlug);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/kpi/transport-means/[categorySlug]/packaging] error", error);
    return NextResponse.json({ error: "Unable to load packaging KPIs" }, { status: 500 });
  }
}
