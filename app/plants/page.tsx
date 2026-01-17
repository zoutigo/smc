import React from "react";
import { getPlants } from "./actions";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import PlantsPageClient from "@/components/plants/PlantsPageClient";

export default async function PlantsPage() {
  const plants = await getPlants();

  return (
    <ConfirmProvider>
      <PlantsPageClient plants={plants} />
    </ConfirmProvider>
  );
}
