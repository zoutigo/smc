"use client";

import React from "react";
import { Gallery } from "@/components/media/Gallery";
import { CustomButton } from "@/components/ui/custom-button";

type Stat = { label: string; value: React.ReactNode };
type Section = { title: string; countLabel?: string; children: React.ReactNode };
type ImageItem = { id: string; url: string };

type Props = {
  categoryName: string;
  name: string;
  description?: string | null;
  backHref: string;
  editHref: string;
  stats: Stat[];
  flowContent?: React.ReactNode;
  notesContent?: React.ReactNode;
  sections?: Section[];
  galleryImages: ImageItem[];
};

export function MeanDetailLayout({
  categoryName,
  name,
  description,
  backHref,
  editHref,
  stats,
  flowContent,
  notesContent,
  sections = [],
  galleryImages,
}: Props) {
  return (
    <main className="px-6 py-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-smc-border bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-smc-text-muted">{categoryName}</p>
              <h1 className="text-3xl font-semibold text-smc-text">{name}</h1>
              <p className="text-sm text-smc-text-muted">{description || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <CustomButton href={backHref} text="Back" variant="destructive" size="sm" />
              <CustomButton href={editHref} text="Edit" size="sm" />
            </div>
          </div>

          {stats.length ? (
            <div className="grid gap-4 rounded-xl border border-smc-border/70 bg-smc-bg/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-[11px] uppercase text-smc-text-muted">{stat.label}</p>
                  <p className="font-semibold text-smc-text">{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {flowContent ? (
            <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner space-y-2">
              {flowContent}
            </div>
          ) : null}

          {notesContent}

          {sections.map((section, idx) => (
            <div
              key={section.title ? `${section.title}-${idx}` : idx}
              className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-smc-text">{section.title}</h3>
                {section.countLabel ? <span className="text-xs text-smc-text-muted">{section.countLabel}</span> : null}
              </div>
              {section.children}
            </div>
          ))}
        </section>

        <aside className="rounded-2xl border border-smc-border bg-white p-4 shadow-soft">
          <Gallery images={galleryImages} />
        </aside>
      </div>
    </main>
  );
}
