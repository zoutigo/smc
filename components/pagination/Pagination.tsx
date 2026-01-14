import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DOTS = "dots" as const;

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => start + idx);
};

export type PaginationRange = Array<number | typeof DOTS>;

export function getPaginationRange(totalPages: number, currentPage: number, siblingCount = 1): PaginationRange {
  if (totalPages <= 0) return [];

  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= totalPages) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + siblingCount * 2;
    const leftRange = range(1, leftItemCount);

    return [...leftRange, DOTS, totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + siblingCount * 2;
    const rightRange = range(totalPages - rightItemCount + 1, totalPages);
    return [firstPageIndex, DOTS, ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  return range(1, totalPages);
}

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  siblingCount?: number;
  className?: string;
}

export default function Pagination({
  totalItems,
  currentPage,
  onPageChange,
  pageSize = 10,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const normalizedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const rangeStart = totalItems === 0 ? 0 : (normalizedPage - 1) * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(normalizedPage * pageSize, totalItems);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === normalizedPage) return;
    onPageChange(nextPage);
  };

  const pages = getPaginationRange(totalPages, normalizedPage, siblingCount);

  return (
    <nav
      aria-label="Pagination"
      data-testid="pagination-root"
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="text-sm text-slate-500" data-testid="pagination-meta">
        {totalItems === 0 ? (
          <span>{pageSize} per page · No records</span>
        ) : (
          <span>Showing {rangeStart}-{rangeEnd} of {totalItems} · {pageSize} per page</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 md:justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="cursor-pointer rounded-full border border-transparent px-4 text-sm font-semibold"
          onClick={() => handlePageChange(normalizedPage - 1)}
          disabled={normalizedPage === 1}
          aria-label="Go to previous page"
        >
          Previous
        </Button>

        <div className="flex items-center gap-1" role="list">
          {pages.map((page, index) =>
            page === DOTS ? (
              <span key={`dots-${index}`} className="px-2 text-base text-slate-300" aria-hidden="true">
                &hellip;
              </span>
            ) : (
              <Button
                key={page}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 w-9 cursor-pointer rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-slate-300",
                  page === normalizedPage && "border-transparent bg-slate-900 text-white shadow",
                )}
                onClick={() => handlePageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={page === normalizedPage ? "page" : undefined}
              >
                {page}
              </Button>
            ),
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="cursor-pointer rounded-full border border-transparent px-4 text-sm font-semibold"
          onClick={() => handlePageChange(normalizedPage + 1)}
          disabled={normalizedPage === totalPages}
          aria-label="Go to next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
