"use client";

import React, { useMemo, useState } from "react";
import type { StorageMeanCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Pagination from "@/components/pagination/Pagination";
import StorageCard from "@/components/storage-means/StorageCard";
import StorageForm from "@/components/storage-means/StorageForm";
import { deleteStorageMeanCategoryAction, updateStorageMeanCategoryAction } from "@/app/storage-means/actions";

export const STORAGE_MEAN_PAGE_SIZE = 6;

interface StorageMeanCategoriesPageClientProps {
  categories: StorageMeanCategory[];
}

export default function StorageMeanCategoriesPageClient({ categories }: StorageMeanCategoriesPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StorageMeanCategory | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const totalItems = categories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / STORAGE_MEAN_PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * STORAGE_MEAN_PAGE_SIZE;
    return categories.slice(start, start + STORAGE_MEAN_PAGE_SIZE);
  }, [categories, currentPage]);

  const handleToggle = () => {
    if (!showForm) {
      setEditingCategory(null);
      setFormMode("create");
      setShowForm(true);
      return;
    }
    if (editingCategory) {
      setEditingCategory(null);
      setFormMode("create");
      return;
    }
    setShowForm(false);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormMode("create");
  };

  const handleDelete = async (id: string) => {
    await deleteStorageMeanCategoryAction({ status: "idle" }, id);
    router.refresh();
  };

  const handleEdit = (category: StorageMeanCategory) => {
    setEditingCategory(category);
    setFormMode("edit");
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    router.refresh();
    if (formMode === "create") {
      setPage(1);
    }
  };

  const layoutClassName = cn("gap-6", showForm ? "grid lg:grid-cols-[minmax(0,1fr)_320px]" : "flex flex-col");
  const cardsGridClassName = cn("grid gap-4 sm:grid-cols-2", showForm ? "lg:grid-cols-2" : "lg:grid-cols-3");

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="heading-1">Storage means</h1>
          <h3 className="text-base font-semibold text-slate-500" data-testid="storage-count-heading">
            {totalItems}
          </h3>
        </div>
        <Button onClick={handleToggle} className="self-start sm:self-auto">
          {showForm ? "Hide form" : "Add storage category"}
        </Button>
      </div>

      <div className={layoutClassName}>
        <div>
          <div data-testid="storage-cards-grid" className={cardsGridClassName}>
            {paginatedCategories.map((category) => (
              <StorageCard
                key={category.id}
                id={category.id}
                name={category.name}
                description={category.description}
                imageUrl={category.imageUrl}
                onEdit={() => handleEdit(category)}
                onDelete={() => handleDelete(category.id)}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-center" data-testid="storage-pagination">
            <Pagination
              totalItems={totalItems}
              currentPage={currentPage}
              pageSize={STORAGE_MEAN_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>

        {showForm && (
          <aside>
            <div className="sticky top-6">
              <StorageForm
                key={editingCategory?.id ?? "create"}
                onClose={handleClose}
                onSuccess={handleFormSuccess}
                mode={formMode}
                submitLabel={editingCategory ? "Update storage category" : undefined}
                successMessage={editingCategory ? "Storage category updated" : undefined}
                initialValues={editingCategory ? {
                  id: editingCategory.id,
                  name: editingCategory.name,
                  description: editingCategory.description,
                  imageUrl: editingCategory.imageUrl ?? undefined,
                } : undefined}
                actionOverride={editingCategory ? ((formData) => updateStorageMeanCategoryAction({ status: "idle" }, editingCategory.id, formData)) : undefined}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
