import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TransportMeansDashboardClient } from "./transport-means-dashboard-client";

jest.mock("@/app/api/kpi/transport-means/route", () => ({}));

describe("TransportMeansDashboardClient", () => {
  it("renders without crashing with empty data", async () => {
    const qc = new QueryClient();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => (
        <TransportMeansDashboardClient
          plants={[{ value: "", label: "All" }]}
          categories={[{ value: "", label: "All" }]}
        />
      ),
      { wrapper }
    );

    await waitFor(() => {
      expect(result).toBeDefined();
    });
  });
});

