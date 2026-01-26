"use client";

import type { Image, StorageMeanCategory } from "@prisma/client";

import { ConfirmProvider } from "@/components/ui/confirm-message";
import { CategoryCataloguePageClient } from "@/components/commonModule/CategoryCataloguePage";
import StorageForm from "@/components/storage-means/StorageForm";
import { deleteStorageMeanCategoryAction } from "./actions";

type Props = {
  categories: Array<StorageMeanCategory & { image: Image | null }>;
  baseHref: string;
  heading?: string;
  subheading?: string;
};

export default function StorageCatalogueClient({ categories, baseHref, heading, subheading }: Props) {
  return (
    <ConfirmProvider>
      <CategoryCataloguePageClient
        categories={categories}
        baseHref={baseHref}
        label="Storage"
        heading={heading ?? "Storage catalogue"}
        subheading={subheading ?? "Browse storage means categories."}
        addButtonText="Add category"
        deleteTitle={(c) => `Delete ${c.name}`}
        deleteDescription={(c) => `Are you sure you want to delete ${c.name}? This action cannot be undone.`}
        FormComponent={StorageForm}
        onDelete={async (id) => {
          await deleteStorageMeanCategoryAction({ status: "idle" }, id);
        }}
      />
    </ConfirmProvider>
  );
}

