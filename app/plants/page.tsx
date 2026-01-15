import React from "react";
import { getPlants } from "./actions";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import type { Plant } from "@prisma/client";
import PlantsPageClient from "@/components/plants/PlantsPageClient";

export default async function PlantsPage() {
  const plants = (await getPlants()) as Plant[];

  return (
    <ConfirmProvider>
      <PlantsPageClient plants={plants} />
    </ConfirmProvider>
  );
}
