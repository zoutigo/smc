import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  getPackagingCategoryKpis,
  parsePackagingCategoryFilters,
} from "@/lib/kpi/packaging-category";

type RouteContext = { params: Promise<{ categorySlug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { searchParams } = new URL(request.url);
  const params = await context.params;
  let filters;
  try {
    filters = parsePackagingCategoryFilters(searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid filters", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  try {
    const data = await getPackagingCategoryKpis(params.categorySlug, filters);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/kpi/packaging-means/[categorySlug]]", error);
    return NextResponse.json({ error: "Unable to load KPIs" }, { status: 500 });
  }
}
