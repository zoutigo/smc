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

export default function StorageCard({ id, name, description, imageUrl, onEdit, onDelete }: StorageCardProps) {
  const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
  const fallback = name.slice(0, 2).toUpperCase();
  const truncatedDescription = description.length > 120 ? `${description.slice(0, 117)}…` : description;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[22px] border border-smc-border bg-smc-card shadow-soft">
      <div className="relative flex items-center justify-between gap-4 bg-gradient-to-r from-smc-primary/20 via-smc-success/10 to-smc-primary/5 px-5 py-4">
        <div className="pointer-events-none absolute inset-y-0 left-[-10%] h-[180%] w-[40%] rounded-full bg-white/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-[-45%] h-32 bg-white/10" aria-hidden />
        <h3 className="relative z-10 text-xl font-semibold text-slate-900 drop-shadow-sm">{name}</h3>
        {hasImage ? (
          <Image
            src={imageUrl!}
            alt={`${name} image`}
            width={64}
            height={64}
            className="relative z-10 h-16 w-16 rounded-2xl object-cover ring-2 ring-white/60 shadow-soft"
            unoptimized
          />
        ) : (
          <div className="relative z-10 h-16 w-16 rounded-2xl bg-white/50 text-smc-primary flex items-center justify-center font-semibold uppercase shadow-soft ring-2 ring-white/60">
            {fallback}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 px-5 py-4 text-sm text-smc-text">
        <p className="leading-relaxed text-smc-text/90" data-testid="storage-description">
          {truncatedDescription}
        </p>
      </div>

      <div data-testid="storage-card-footer" className="relative flex items-center justify-between border-t border-smc-border/40 bg-gradient-to-r from-white via-smc-bg/80 to-white px-4 py-3">
        <span className="relative z-10 text-xs font-semibold tracking-[0.3em] text-smc-primary" data-testid="storage-label">
          STORAGE
        </span>
        <div className="relative z-10 flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Edit storage mean category"
            className="h-9 w-9 rounded-xl border border-smc-border bg-white text-smc-primary/80 hover:bg-smc-primary/10"
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
