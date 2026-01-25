import { GET } from "./route";
import { getPackagingMeansKpis } from "@/lib/kpi/packaging-means";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown) => ({ json: async () => data }),
  },
}));

jest.mock("@/lib/kpi/packaging-means", () => {
  const actual = jest.requireActual("@/lib/kpi/packaging-means");
  return {
    ...actual,
    getPackagingMeansKpis: jest.fn(),
  };
});

describe("GET /api/kpi/packaging-means", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns empty data gracefully when DB fails", async () => {
    (getPackagingMeansKpis as jest.Mock).mockRejectedValueOnce(new Error("db down"));
    const req = new Request("http://localhost/api/kpi/packaging-means");
    const res = await GET(req);
    const json = await res.json();
    expect(json.data).toBeDefined();
  });
});

