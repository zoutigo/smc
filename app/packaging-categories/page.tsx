import React from "react";
import type { PackagingCategory } from "@prisma/client";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import PackagingCategoriesPageClient from "@/components/packaging-categories/PackagingCategoriesPageClient";
import { getPackagingCategories } from "./actions";

export default async function PackagingCategoriesPage() {
  const categories = (await getPackagingCategories()) as PackagingCategory[];

  return (
    <ConfirmProvider>
      <PackagingCategoriesPageClient categories={categories} />
    </ConfirmProvider>
  );
}
