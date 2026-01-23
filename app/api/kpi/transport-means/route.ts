import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getTransportMeansKpis, parseTransportKpiFilters } from "@/lib/kpi/transport-means";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  let filters;
  try {
    filters = parseTransportKpiFilters(searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid filters", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  try {
    const data = await getTransportMeansKpis(filters);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/kpi/transport-means] error", error);
    return NextResponse.json({ error: "Unable to load KPIs" }, { status: 500 });
  }
}
