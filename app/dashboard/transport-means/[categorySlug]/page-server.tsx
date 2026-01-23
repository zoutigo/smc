import { notFound } from "next/navigation";

import { getPrisma } from "@/lib/prisma";
import { QueryClientWrapper } from "@/components/providers/query-client-provider";
import { CategoryDashboardClient } from "./category-dashboard-client";

type ServerPageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function renderTransportCategoryDashboard({ params }: ServerPageProps) {
  const { categorySlug } = await params;
  const prisma = getPrisma();

  const category = await prisma.transportMeanCategory.findUnique({
    where: { slug: categorySlug },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (!category) return notFound();

  const [plants, flows] = await Promise.all([
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  const plantOptions = plants.map((plant) => ({ value: plant.id, label: plant.name }));
  const flowOptions = flows.map((flow) => ({ value: flow.id, label: `${flow.from.toLowerCase()} → ${flow.to.toLowerCase()}` }));

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <QueryClientWrapper>
        <CategoryDashboardClient category={category} plants={plantOptions} flows={flowOptions} />
      </QueryClientWrapper>
    </main>
  );
}
