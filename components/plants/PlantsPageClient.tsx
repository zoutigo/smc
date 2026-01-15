"use client";

import React, { useMemo, useState } from "react";
import type { Plant } from "@prisma/client";
import PlantCard from "@/components/plants/PlantCard";
import PlantForm from "@/components/plants/PlantForm";
import { Button } from "@/components/ui/button";
import { deletePlantAction, updatePlantAction } from "@/app/plants/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Pagination from "@/components/pagination/Pagination";

export const PLANTS_PAGE_SIZE = 6;

interface PlantsPageClientProps {
  plants: Plant[];
}

export default function PlantsPageClient({ plants }: PlantsPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const totalItems = plants.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PLANTS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const paginatedPlants = useMemo(() => {
    const startIndex = (currentPage - 1) * PLANTS_PAGE_SIZE;
    return plants.slice(startIndex, startIndex + PLANTS_PAGE_SIZE);
  }, [plants, currentPage]);

  const handleToggle = () => {
    if (!showForm) {
      setEditingPlant(null);
      setFormMode("create");
      setShowForm(true);
      return;
    }
    if (editingPlant) {
      setEditingPlant(null);
      setFormMode("create");
      return;
    }
    setShowForm(false);
  };
  const handleClose = () => {
    setShowForm(false);
    setEditingPlant(null);
    setFormMode("create");
  };

  const handleDelete = async (id: string) => {
    await deletePlantAction({ status: "idle" }, id);
    router.refresh();
  };

  const handleEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setFormMode("edit");
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    router.refresh();
    if (formMode === "create") {
      setPage(1);
    }
  };

  const layoutClassName = cn(
    "gap-6",
    showForm ? "grid lg:grid-cols-[minmax(0,1fr)_320px]" : "flex flex-col",
  );

  const cardsGridClassName = cn(
    "grid gap-4 sm:grid-cols-2",
    showForm ? "lg:grid-cols-2" : "lg:grid-cols-3",
  );

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-baseline gap-4">
          <h1 className="heading-1">Plants</h1>
          <h3 className="text-base font-semibold text-slate-500" data-testid="plants-count-heading">
            {totalItems}
          </h3>
        </div>
        <Button onClick={handleToggle} className="self-start sm:self-auto">
          {showForm ? "Hide form" : "Add plant"}
        </Button>
      </div>

      <div className={layoutClassName}>
        <div>
          <div data-testid="plant-cards-grid" className={cardsGridClassName}>
            {paginatedPlants.map((p) => (
              <PlantCard
                key={p.id}
                id={p.id}
                plantName={p.plantName}
                city={p.city}
                country={p.country}
                address={p.address}
                zipcode={p.zipcode}
                image={p.image}
                onEdit={() => handleEdit(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-center" data-testid="plants-pagination">
            <Pagination
              totalItems={totalItems}
              currentPage={currentPage}
              pageSize={PLANTS_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>

        {showForm && (
          <aside>
            <div className="sticky top-6">
              <PlantForm
                key={editingPlant?.id ?? "create"}
                onClose={handleClose}
                onSuccess={handleFormSuccess}
                mode={formMode}
                initialValues={editingPlant ? {
                  id: editingPlant.id,
                  plantName: editingPlant.plantName,
                  address: editingPlant.address ?? "",
                  city: editingPlant.city,
                  zipcode: editingPlant.zipcode ?? "",
                  country: editingPlant.country,
                  image: editingPlant.image ?? undefined,
                } : undefined}
                submitLabel={editingPlant ? "Update plant" : undefined}
                successMessage={editingPlant ? "Plant updated" : undefined}
                actionOverride={editingPlant ? ((formData) => updatePlantAction({ status: "idle" }, editingPlant.id, formData)) : undefined}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
