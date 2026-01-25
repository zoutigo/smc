import { GET } from "./route";
import { getTransportMeansKpis } from "@/lib/kpi/transport-means";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown) => ({ json: async () => data }),
  },
}));

jest.mock("@/lib/kpi/transport-means", () => {
  const actual = jest.requireActual("@/lib/kpi/transport-means");
  return {
    ...actual,
    getTransportMeansKpis: jest.fn(),
  };
});

describe("GET /api/kpi/transport-means", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns empty data gracefully when DB fails", async () => {
    (getTransportMeansKpis as jest.Mock).mockRejectedValueOnce(new Error("db down"));
    const req = new Request("http://localhost/api/kpi/transport-means");
    const res = await GET(req);
    const json = await res.json();
    expect(json.data).toBeDefined();
  });
});

