import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getTransportMeansKpis, parseTransportKpiFilters } from "@/lib/kpi/transport-means";

export const revalidate = 300;

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
    return NextResponse.json({
      data: {
        overview: { countTransportMeans: 0, countCategories: 0, countPlants: 0, totalLoadCapacityKg: 0, avgMaxSpeedKmh: 0, packagingCoverage: 0, flowsCoverage: 0, multiFlowCount: 0 },
        charts: { countByCategory: [], capacityByPlant: [], capacityByCategory: [], supplierDonut: [], capacitySpeedScatter: [] },
        table: [],
      },
    });
  }
}
