"use client";

import React, { useMemo, useState } from "react";
import type { Image, StorageMeanCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Pagination from "@/components/pagination/Pagination";
import StorageCard from "@/components/storage-means/StorageCard";
import StorageForm from "@/components/storage-means/StorageForm";
import { deleteStorageMeanCategoryAction, updateStorageMeanCategoryAction } from "@/app/storage-means/actions";

export const STORAGE_MEAN_PAGE_SIZE = 6;

interface StorageMeanCategoriesPageClientProps {
  categories: Array<StorageMeanCategory & { image: Image | null }>;
}

export default function StorageMeanCategoriesPageClient({ categories }: StorageMeanCategoriesPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<(StorageMeanCategory & { image: Image | null }) | null>(null);
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

  const handleEdit = (category: StorageMeanCategory & { image: Image | null }) => {
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

  const layoutClassName = cn("gap-8", showForm ? "grid lg:grid-cols-[minmax(0,1fr)_360px]" : "grid");
  const cardsGridClassName = cn(
    "grid gap-6 sm:grid-cols-2",
    showForm ? "lg:grid-cols-2" : "lg:grid-cols-3"
  );

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[28px] border border-smc-border/60 bg-gradient-to-r from-white via-smc-bg/60 to-white p-7 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-smc-primary/80">Storage means</p>
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="heading-1 leading-[1.05]">Storage catalogue</h1>
              <div className="rounded-full bg-smc-primary/10 px-3 py-1 text-xs font-semibold text-smc-primary" data-testid="storage-count-heading">
                {totalItems} total
              </div>
            </div>
            <p className="max-w-2xl text-sm text-smc-text-muted">
              Curated storage environments with imagery-first cards for quick scanning. Desktop focused for clean, roomy layouts.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Button onClick={handleToggle} className="self-stretch sm:self-auto">
              {showForm ? "Hide form" : "Add storage category"}
            </Button>
            <p className="text-xs text-smc-text-muted">Upload visuals to showcase each category.</p>
          </div>
        </div>
      </section>

      <div className="rounded-[26px] border border-smc-border/80 bg-white/85 p-6 shadow-card ring-1 ring-white/70 backdrop-blur">
        <div className={layoutClassName}>
          <div className="space-y-6">
            <div data-testid="storage-cards-grid" className={cardsGridClassName}>
              {paginatedCategories.map((category) => (
                <StorageCard
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  description={category.description}
                  imageUrl={category.image?.imageUrl}
                  onEdit={() => handleEdit(category)}
                  onDelete={() => handleDelete(category.id)}
                />
              ))}
            </div>
            <div className="flex justify-center" data-testid="storage-pagination">
              <Pagination
                totalItems={totalItems}
                currentPage={currentPage}
                pageSize={STORAGE_MEAN_PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </div>

          {showForm && (
            <aside className="block">
              <div className="lg:sticky lg:top-6 space-y-4 overflow-hidden rounded-2xl border border-secondary/80 ring-1 ring-secondary/50 bg-gradient-to-br from-secondary/10 via-white to-smc-bg/85 p-5 shadow-card">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-smc-primary/80">Editor</p>
                  <h3 className="text-xl font-semibold text-smc-text">{formMode === "edit" ? "Update category" : "Create category"}</h3>
                  <p className="text-sm text-smc-text-muted">Keep descriptions concise and imagery edge-to-edge.</p>
                </div>
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
                    imageUrl: editingCategory.image?.imageUrl ?? undefined,
                  } : undefined}
                  actionOverride={editingCategory ? ((formData) => updateStorageMeanCategoryAction({ status: "idle" }, editingCategory.id, formData)) : undefined}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
