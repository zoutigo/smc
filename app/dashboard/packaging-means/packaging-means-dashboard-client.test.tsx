import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PackagingMeansDashboardClient } from "./packaging-means-dashboard-client";

jest.mock("@/app/api/kpi/packaging-means/route", () => ({}));

describe("PackagingMeansDashboardClient", () => {
  it("renders without crashing with empty data", async () => {
    const qc = new QueryClient();

    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

    const { result } = renderHook(
      () => (
        <PackagingMeansDashboardClient
          plants={[{ value: "", label: "All" }]}
          flows={[{ value: "", label: "All" }]}
        />
      ),
      { wrapper }
    );

    await waitFor(() => {
      expect(result).toBeDefined();
    });
  });
});

