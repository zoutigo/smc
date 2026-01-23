import { GET as flowsRoute } from "@/app/api/kpi/transport-means/[categorySlug]/flows/route";
import { GET as packagingRoute } from "@/app/api/kpi/transport-means/[categorySlug]/packaging/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (_body: unknown, init?: ResponseInit) => {
      const headers = new Headers({ "content-type": "application/json" });
      return { status: init?.status ?? 200, headers } as Response;
    },
  },
}));

jest.mock("@/lib/kpi/transport-category-flows", () => ({
  getTransportCategoryFlowsKpis: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/kpi/transport-category-packaging", () => ({
  getTransportCategoryPackagingKpis: jest.fn().mockResolvedValue([]),
}));

describe("Transport category KPI routes", () => {
  it("rejects invalid category on flows route", async () => {
    const res = (await flowsRoute(new Request("http://localhost/api/kpi/transport-means/unknown/flows"), {
      params: Promise.resolve({ categorySlug: "unknown" }),
    } as unknown as { params: Promise<{ categorySlug: string }> })) as Response;
    expect(res.status).toBeGreaterThanOrEqual(200);
  });

  it("returns JSON on packaging route", async () => {
    const res = (await packagingRoute(new Request("http://localhost/api/kpi/transport-means/unknown/packaging"), {
      params: Promise.resolve({ categorySlug: "unknown" }),
    } as unknown as { params: Promise<{ categorySlug: string }> })) as Response;
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
