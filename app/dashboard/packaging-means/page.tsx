import { getPrisma } from "@/lib/prisma";

import { QueryClientWrapper } from "@/components/providers/query-client-provider";
import { PackagingMeansDashboardClient } from "./packaging-means-dashboard-client";

export const metadata = {
  title: "Packaging means dashboard",
  description: "KPI overview for all packaging means and categories.",
};

export const dynamic = "force-dynamic";

export default async function PackagingMeansDashboardPage() {
  const prisma = getPrisma();

  const [plants, flows] = await Promise.all([
    prisma.plant.findMany({ select: { id: true, name: true } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true } }),
  ]);

  const plantOptions = plants.map((plant) => ({
    value: plant.id,
    label: plant.name,
  }));

  const flowOptions = flows.map((flow) => ({
    value: flow.id,
    label: `${flow.from.toLowerCase()} → ${flow.to.toLowerCase()}`,
  }));

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <QueryClientWrapper>
        <PackagingMeansDashboardClient plants={plantOptions} flows={flowOptions} />
      </QueryClientWrapper>
    </main>
  );
}
