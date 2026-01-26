"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

export type MeanCardItem = {
  id: string;
  name: string;
  description?: string | null;
  label: string;
  dimensionsLabel?: string;
  plantName?: string | null;
  flowSlug?: string | null;
  priceLabel?: string;
  statusLabel?: string;
  unitsLabel?: string;
  variantsLabel?: string;
  updatedAt?: string;
  sop?: string;
  eop?: string;
  imageUrl?: string | null;
  viewHref: string;
  editHref?: string;
};

type MeanCardsGridProps = {
  items: MeanCardItem[];
  emptyMessage?: string;
  className?: string;
};

export function MeanCardsGrid({ items, emptyMessage = "No items yet in this category.", className }: MeanCardsGridProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <article key={item.id} className="flex h-full flex-col rounded-2xl border border-smc-border/70 bg-white p-5 shadow-soft">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-smc-text">{item.name}</h3>
                {item.dimensionsLabel ? <p className="text-sm font-medium text-smc-text">{item.dimensionsLabel}</p> : null}
              </div>
            </div>
            <p className="text-sm text-smc-text/90 line-clamp-2">{item.description ?? "No description."}</p>

            <div className="grid grid-cols-2 gap-3 text-xs text-smc-text">
              {item.plantName ? (
                <div>
                  <p className="font-semibold text-smc-text-muted">Plant</p>
                  <p>{item.plantName}</p>
                </div>
              ) : null}
              {item.flowSlug ? (
                <div>
                  <p className="font-semibold text-smc-text-muted">Flow</p>
                  <p>{item.flowSlug}</p>
                </div>
              ) : null}
              {item.priceLabel ? (
                <div>
                  <p className="font-semibold text-smc-text-muted">Price</p>
                  <p>{item.priceLabel}</p>
                </div>
              ) : null}
              {item.statusLabel ? (
                <div>
                  <p className="font-semibold text-smc-text-muted">Status</p>
                  <p className="capitalize">{item.statusLabel}</p>
                </div>
              ) : null}
              {item.unitsLabel ? (
                <div>
                  <p className="font-semibold text-smc-text-muted">Units</p>
                  <p>{item.unitsLabel}</p>
                </div>
              ) : null}
              {item.variantsLabel ? (
                <div>
                  <p className="font-semibold text-smc-text-muted">Variants</p>
                  <p>{item.variantsLabel}</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-smc-text-muted">
              {item.updatedAt ? (
                <p>
                  <span className="font-semibold text-smc-text">Updated:</span> {item.updatedAt}
                </p>
              ) : null}
              {item.sop ? (
                <p>
                  <span className="font-semibold text-smc-text">SOP:</span> {item.sop}
                </p>
              ) : null}
              {item.eop ? (
                <p>
                  <span className="font-semibold text-smc-text">EOP:</span> {item.eop}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-auto -mx-5 -mb-5 flex justify-end gap-2 bg-secondary/30 px-5 py-4">
            {item.editHref ? (
              <Button
                size="icon"
                variant="outline"
                className="border-smc-primary text-smc-primary bg-white hover:bg-smc-bg"
                asChild
                aria-label={`Edit ${item.name}`}
              >
                <Link href={item.editHref}>
                  <PencilIcon />
                </Link>
              </Button>
            ) : null}
            <Button size="icon" variant="secondary" className="text-white" asChild aria-label={`View ${item.name}`}>
              <Link href={item.viewHref}>
                <EyeIcon />
              </Link>
            </Button>
          </div>
        </article>
      ))}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-smc-border/70 bg-smc-bg/60 p-6 text-sm text-smc-text-muted">{emptyMessage}</div>
      ) : null}
    </div>
  );
}
