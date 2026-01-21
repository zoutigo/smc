"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ConfirmModal";

type StorageCardProps = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  href?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

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

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10 13a5 5 0 0 0 7.54.54l1.96-1.96a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-1.96 1.96a5 5 0 0 0 7.07 7.07l1.72-1.71" />
  </svg>
);

export default function StorageCard({ id, name, description, imageUrl, href, onEdit, onDelete }: StorageCardProps) {
  const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
  const fallback = name.slice(0, 2).toUpperCase();
  const truncatedDescription = description.length > 120 ? `${description.slice(0, 117)}…` : description;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-smc-border/70 bg-white shadow-soft">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(248,228,182,0.18),transparent_38%)] opacity-70" aria-hidden />
      <div className="relative overflow-hidden">
        {hasImage ? (
          <Image
            src={imageUrl!}
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
        <p className="leading-relaxed text-smc-text/90" data-testid="storage-description">
          {truncatedDescription}
        </p>
      </div>

      <div data-testid="storage-card-footer" className="relative flex items-center justify-between border-t border-smc-border/60 bg-gradient-to-r from-white via-smc-bg/70 to-white px-5 py-3">
        <span className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.35em] text-smc-primary" data-testid="storage-label">
          STORAGE
        </span>
        <div className="relative z-10 flex items-center gap-2">
          {href ? (
            <a
              href={href}
              aria-label="View storage mean category"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-smc-border bg-white text-smc-primary/80 transition hover:-translate-y-[1px] hover:bg-smc-primary/10"
            >
              <LinkIcon />
            </a>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            aria-label="Edit storage mean category"
            className="h-9 w-9 rounded-xl border border-smc-border bg-white text-smc-primary/80 transition hover:-translate-y-[1px] hover:bg-smc-primary/10"
            onClick={() => onEdit?.(id)}
          >
            <PencilIcon />
          </Button>
          <ConfirmModal
            title="Delete storage category"
            description={`Are you sure you want to delete ${name}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            destructive
            onConfirm={async () => {
              await onDelete?.(id);
            }}
            trigger={
              <Button size="icon" variant="destructive" aria-label="Delete storage mean category" className="h-9 w-9 rounded-xl">
                <TrashIcon />
              </Button>
            }
          />
        </div>
      </div>
    </article>
  );
}
