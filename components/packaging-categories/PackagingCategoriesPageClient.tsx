"use client";

import React, { useMemo, useState } from "react";
import type { PackagingCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Pagination from "@/components/pagination/Pagination";
import PackagingCard from "@/components/packaging-categories/PackagingCard";
import PackagingForm from "@/components/packaging-categories/PackagingForm";
import { deletePackagingCategoryAction, updatePackagingCategoryAction } from "@/app/packaging-categories/actions";

export const PACKAGING_CATEGORIES_PAGE_SIZE = 6;

interface PackagingCategoriesPageClientProps {
  categories: PackagingCategory[];
}

export default function PackagingCategoriesPageClient({ categories }: PackagingCategoriesPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PackagingCategory | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const totalItems = categories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PACKAGING_CATEGORIES_PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PACKAGING_CATEGORIES_PAGE_SIZE;
    return categories.slice(start, start + PACKAGING_CATEGORIES_PAGE_SIZE);
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
    await deletePackagingCategoryAction({ status: "idle" }, id);
    router.refresh();
  };

  const handleEdit = (category: PackagingCategory) => {
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
          <h1 className="heading-1">Packaging categories</h1>
          <h3 className="text-base font-semibold text-slate-500" data-testid="packaging-count-heading">
            {totalItems}
          </h3>
        </div>
        <Button onClick={handleToggle} className="self-start sm:self-auto">
          {showForm ? "Hide form" : "Add category"}
        </Button>
      </div>

      <div className={layoutClassName}>
        <div>
          <div data-testid="packaging-cards-grid" className={cardsGridClassName}>
            {paginatedCategories.map((category) => (
              <PackagingCard
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
          <div className="mt-6 flex justify-center" data-testid="packaging-pagination">
            <Pagination
              totalItems={totalItems}
              currentPage={currentPage}
              pageSize={PACKAGING_CATEGORIES_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>

        {showForm && (
          <aside>
            <div className="sticky top-6">
              <PackagingForm
                key={editingCategory?.id ?? "create"}
                onClose={handleClose}
                onSuccess={handleFormSuccess}
                mode={formMode}
                submitLabel={editingCategory ? "Update category" : undefined}
                successMessage={editingCategory ? "Category updated" : undefined}
                initialValues={editingCategory ? {
                  id: editingCategory.id,
                  name: editingCategory.name,
                  description: editingCategory.description,
                  imageUrl: editingCategory.imageUrl ?? undefined,
                } : undefined}
                actionOverride={editingCategory ? ((formData) => updatePackagingCategoryAction({ status: "idle" }, editingCategory.id, formData)) : undefined}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
