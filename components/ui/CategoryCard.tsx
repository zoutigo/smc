"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ConfirmModal";

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

type CategoryCardProps = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  label: string;
  href?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  fallbackImageUrl?: string;
  viewAriaLabel?: string;
  editAriaLabel?: string;
  deleteAriaLabel?: string;
  deleteTitle?: string;
  deleteDescription?: string;
  deleteConfirmText?: string;
  deleteCancelText?: string;
  descriptionTestId?: string;
  footerTestId?: string;
  labelTestId?: string;
};

export default function CategoryCard({
  id,
  name,
  description,
  imageUrl,
  label,
  href,
  onEdit,
  onDelete,
  viewAriaLabel = "View category",
  editAriaLabel = "Edit category",
  deleteAriaLabel = "Delete category",
  deleteTitle = "Delete category",
  deleteDescription,
  deleteConfirmText = "Delete",
  deleteCancelText = "Cancel",
  descriptionTestId,
  footerTestId,
  labelTestId,
  fallbackImageUrl,
}: CategoryCardProps) {
  const effectiveImageUrl = imageUrl?.trim().length ? imageUrl.trim() : fallbackImageUrl?.trim() || "";
  const hasImage = Boolean(imageUrl?.trim().length) || Boolean(fallbackImageUrl?.trim().length);
  const fallback = name.slice(0, 2).toUpperCase();
  const safeDescription = description && description.trim().length > 0 ? description : "No description.";
  const truncatedDescription = safeDescription.length > 120 ? `${safeDescription.slice(0, 117)}…` : safeDescription;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-smc-border/70 bg-white shadow-soft">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(248,228,182,0.18),transparent_38%)] opacity-70" aria-hidden />
      <div className="relative overflow-hidden">
        {hasImage ? (
          <Image
            src={effectiveImageUrl}
            alt={`${name} image`}
            width={640}
            height={360}
            className="h-44 w-full object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-smc-primary/30 via-smc-info/10 to-white text-3xl font-semibold uppercase text-smc-primary">
            {fallback}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" aria-hidden />
      </div>

      <div className="relative flex-1 space-y-3 px-5 py-4 text-sm text-smc-text">
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <p className="leading-relaxed text-smc-text/90" data-testid={descriptionTestId}>
          {truncatedDescription}
        </p>
      </div>

      <div data-testid={footerTestId} className="relative flex items-center justify-between border-t border-smc-border/60 bg-gradient-to-r from-white via-smc-bg/70 to-white px-5 py-3">
        <span className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.35em] text-smc-primary" data-testid={labelTestId}>
          {label}
        </span>
        <div className="relative z-10 flex items-center gap-2">
          {href ? (
            <a
              href={href}
              aria-label={viewAriaLabel}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-secondary bg-secondary text-white transition hover:-translate-y-[1px] hover:brightness-110"
            >
              <EyeIcon />
            </a>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              aria-label={viewAriaLabel}
              className="h-9 w-9 cursor-pointer rounded-xl border border-secondary bg-secondary text-white"
              disabled
            >
              <EyeIcon />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            aria-label={editAriaLabel}
            className="h-9 w-9 cursor-pointer rounded-xl border border-secondary bg-white text-smc-primary/80 transition hover:-translate-y-[1px] hover:bg-smc-primary/10"
            onClick={() => onEdit?.(id)}
            disabled={!onEdit}
          >
            <PencilIcon />
          </Button>
          {onDelete ? (
            <ConfirmModal
              title={deleteTitle}
              description={deleteDescription ?? `Are you sure you want to delete ${name}? This action cannot be undone.`}
              confirmText={deleteConfirmText}
              cancelText={deleteCancelText}
              destructive
              onConfirm={async () => {
                await onDelete?.(id);
              }}
              trigger={
                <Button size="icon" variant="destructive" aria-label={deleteAriaLabel} className="h-9 w-9 cursor-pointer rounded-xl">
                  <TrashIcon />
                </Button>
              }
            />
          ) : (
            <Button size="icon" variant="destructive" aria-label={deleteAriaLabel} className="h-9 w-9 cursor-pointer rounded-xl" disabled>
              <TrashIcon />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
