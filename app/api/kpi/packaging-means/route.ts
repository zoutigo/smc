import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getPackagingMeansKpis, parsePackagingKpiFilters } from "@/lib/kpi/packaging-means";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  let filters;
  try {
    filters = parsePackagingKpiFilters(searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid filters", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  try {
    const data = await getPackagingMeansKpis(filters);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/kpi/packaging-means] error", error);
    return NextResponse.json({ error: "Unable to load KPIs" }, { status: 500 });
  }
}
