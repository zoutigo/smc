import { notFound } from "next/navigation";

import { StorageCategoryDashboardClient } from "./storage-category-dashboard-client";
import { getStorageDashboardData } from "@/lib/storage-dashboard-data";
import { getPrisma } from "@/lib/prisma";

type ServerPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const prisma = getPrisma();
  try {
    const categories = await prisma.storageMeanCategory.findMany({ select: { slug: true } });
    return categories.map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

export async function renderStorageCategoryDashboard({ params }: ServerPageProps) {
  const { category } = await params;
  const prisma = getPrisma();
  const categoryRow = await prisma.storageMeanCategory.findUnique({
    where: { slug: category },
    select: { id: true, name: true, slug: true, description: true },
  });
  if (!categoryRow) return notFound();

  const data = await getStorageDashboardData(category);

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <StorageCategoryDashboardClient category={categoryRow} data={data} />
    </main>
  );
}
