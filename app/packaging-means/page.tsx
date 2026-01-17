import React from "react";
import type { Image, PackagingMeanCategory } from "@prisma/client";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import PackagingCategoriesPageClient from "@/components/packaging-means/PackagingCategoriesPageClient";
import { getPackagingMeanCategories } from "./actions";

export default async function PackagingMeansPage() {
  const categories = (await getPackagingMeanCategories()) as Array<PackagingMeanCategory & { image: Image | null }>;

  return (
    <ConfirmProvider>
      <PackagingCategoriesPageClient categories={categories} />
    </ConfirmProvider>
  );
}
