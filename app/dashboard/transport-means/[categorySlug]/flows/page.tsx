import { notFound } from "next/navigation";

import { QueryClientWrapper } from "@/components/providers/query-client-provider";
import { FlowsClient } from "./page.client";
import { getPrisma } from "@/lib/prisma";

type Params = Promise<{ categorySlug: string }>;

export const metadata = {
  title: "Transport flows coverage",
};

export default async function Page({ params }: { params: Params }) {
  const { categorySlug } = await params;
  const prisma = getPrisma();
  const category = await prisma.transportMeanCategory.findUnique({ where: { slug: categorySlug }, select: { name: true } });
  if (!category) return notFound();

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <QueryClientWrapper>
        <FlowsClient categorySlug={categorySlug} categoryName={category.name} />
      </QueryClientWrapper>
    </main>
  );
}
