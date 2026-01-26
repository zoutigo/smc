import { QueryClientWrapper } from "@/components/providers/query-client-provider";
import { TransportMeansDashboardClient } from "./transport-means-dashboard-client";
import { getTransportDashboardFilters } from "@/lib/dashboard-filters";

export const metadata = {
  title: "Transport means dashboard",
  description: "KPI overview for all transport means and categories.",
};

export const revalidate = 300;

export default async function TransportMeansDashboardPage() {
  let plantOptions: { value: string; label: string }[] = [];
  let categoryOptions: { value: string; label: string }[] = [];

  try {
    const filters = await getTransportDashboardFilters();
    plantOptions = filters.plants;
    categoryOptions = filters.categories;
  } catch (err) {
    console.error("Transport dashboard filters failed, using empty filters", err);
  }

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <QueryClientWrapper>
        <TransportMeansDashboardClient plants={plantOptions} categories={categoryOptions} />
      </QueryClientWrapper>
    </main>
  );
}
