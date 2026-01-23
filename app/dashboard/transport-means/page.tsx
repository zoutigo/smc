import { getPrisma } from "@/lib/prisma";

import { QueryClientWrapper } from "@/components/providers/query-client-provider";
import { TransportMeansDashboardClient } from "./transport-means-dashboard-client";

export const metadata = {
  title: "Transport means dashboard",
  description: "KPI overview for all transport means and categories.",
};

export const dynamic = "force-dynamic";

export default async function TransportMeansDashboardPage() {
  const prisma = getPrisma();

  const [plants, categories] = await Promise.all([
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.transportMeanCategory.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const plantOptions = plants.map((plant) => ({ value: plant.id, label: plant.name }));
  const categoryOptions = categories.map((cat) => ({ value: cat.slug, label: cat.name }));

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <QueryClientWrapper>
        <TransportMeansDashboardClient plants={plantOptions} categories={categoryOptions} />
      </QueryClientWrapper>
    </main>
  );
}
