import React from "react";
import type { Image, StorageMeanCategory } from "@prisma/client";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import StorageMeanCategoriesPageClient from "@/components/storage-means/StorageMeanCategoriesPageClient";
import { getStorageMeanCategories } from "./actions";

export default async function StorageMeansPage() {
  const categories = (await getStorageMeanCategories()) as Array<StorageMeanCategory & { image: Image | null }>;

  return (
    <ConfirmProvider>
      <StorageMeanCategoriesPageClient categories={categories} />
    </ConfirmProvider>
  );
}
