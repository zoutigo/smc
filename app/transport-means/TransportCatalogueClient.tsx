"use client";

import type { Image, TransportMeanCategory } from "@prisma/client";

import { ConfirmProvider } from "@/components/ui/confirm-message";
import { CategoryCataloguePageClient } from "@/components/commonModule/CategoryCataloguePage";
import TransportCategoryForm from "@/components/transport-means/TransportCategoryForm";
import { deleteTransportMeanCategoryAction } from "./actions";

type Props = {
  categories: Array<TransportMeanCategory & { image: Image | null }>;
  baseHref: string;
  heading?: string;
  subheading?: string;
};

export default function TransportCatalogueClient({ categories, baseHref, heading, subheading }: Props) {
  return (
    <ConfirmProvider>
      <CategoryCataloguePageClient
        categories={categories}
        baseHref={baseHref}
        label="Transport"
        heading={heading ?? "Transport catalogue"}
        subheading={subheading ?? "Curated transport categories with clear, card-first navigation."}
        addButtonText="Add category"
        deleteTitle={(c) => `Delete ${c.name}`}
        deleteDescription={(c) => `Are you sure you want to delete ${c.name}? This action cannot be undone.`}
        FormComponent={TransportCategoryForm}
        onDelete={async (id) => {
          await deleteTransportMeanCategoryAction({ status: "idle" }, id);
        }}
      />
    </ConfirmProvider>
  );
}

