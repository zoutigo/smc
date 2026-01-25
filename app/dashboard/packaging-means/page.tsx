import { QueryClientWrapper } from "@/components/providers/query-client-provider";
import { PackagingMeansDashboardClient } from "./packaging-means-dashboard-client";
import { getPackagingDashboardFilters } from "@/lib/dashboard-filters";

export const metadata = {
  title: "Packaging means dashboard",
  description: "KPI overview for all packaging means and categories.",
};

export const dynamic = "force-dynamic";

export default async function PackagingMeansDashboardPage() {
  let plantOptions: { value: string; label: string }[] = [];
  let flowOptions: { value: string; label: string }[] = [];

  try {
    const filters = await getPackagingDashboardFilters();
    plantOptions = filters.plants;
    flowOptions = filters.flows;
  } catch (err) {
    console.error("Packaging dashboard filters failed, using empty filters", err);
  }

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <QueryClientWrapper>
        <PackagingMeansDashboardClient plants={plantOptions} flows={flowOptions} />
      </QueryClientWrapper>
    </main>
  );
}
