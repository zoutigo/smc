"use client";

import type { Image, PackagingMeanCategory } from "@prisma/client";

import { ConfirmProvider } from "@/components/ui/confirm-message";
import { CategoryCataloguePageClient } from "@/components/commonModule/CategoryCataloguePage";
import PackagingForm from "@/components/packaging-means/PackagingForm";
import { deletePackagingMeanCategoryAction } from "./actions";

type Props = {
  categories: Array<PackagingMeanCategory & { image: Image | null }>;
  baseHref: string;
  heading?: string;
  subheading?: string;
};

export default function PackagingCatalogueClient({ categories, baseHref, heading, subheading }: Props) {
  return (
    <ConfirmProvider>
      <CategoryCataloguePageClient
        categories={categories}
        baseHref={baseHref}
        label="Packaging"
        heading={heading ?? "Packaging catalogue"}
        subheading={subheading ?? "Curated packaging assets with imagery-first cards for quick scanning. Desktop focused for clean, roomy layouts."}
        addButtonText="Add category"
        deleteTitle={(c) => `Delete ${c.name}`}
        deleteDescription={(c) => `Are you sure you want to delete ${c.name}? This action cannot be undone.`}
        FormComponent={PackagingForm}
        onDelete={async (id) => {
          await deletePackagingMeanCategoryAction({ status: "idle" }, id);
        }}
        descriptionTestId="packaging-description"
        footerTestId="packaging-card-footer"
        labelTestId="packaging-label"
      />
    </ConfirmProvider>
  );
}

