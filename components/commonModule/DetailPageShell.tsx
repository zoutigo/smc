"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Stat = { label: string; value: string | number | React.ReactNode };
type Section = { title: string; children: React.ReactNode };

type Props = {
  heroTitle: string;
  heroSubtitle?: string;
  badge?: string;
  updatedAt?: string;
  countLabel?: string;
  heroImage?: React.ReactNode;
  actions?: React.ReactNode;
  stats?: Stat[];
  sections: Section[];
  className?: string;
};

export default function DetailPageShell({
  heroTitle,
  heroSubtitle,
  badge,
  updatedAt,
  countLabel,
  heroImage,
  actions,
  stats,
  sections,
  className,
}: Props) {
  return (
    <main className={cn("space-y-4 px-6 pb-6 pt-0", className)}>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}

      <section className="grid gap-6 rounded-3xl border border-smc-border bg-white p-6 shadow-soft lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-smc-primary">{heroTitle}</h1>
              {heroSubtitle ? <p className="text-base text-slate-600">{heroSubtitle}</p> : null}
            </div>
            <div className="flex flex-col gap-2 text-right">
              {countLabel ? (
                <div className="rounded-full border border-smc-border/80 px-4 py-2 text-sm text-smc-text-muted">{countLabel}</div>
              ) : null}
              {badge ? <span className="text-xs font-semibold uppercase tracking-[0.2em] text-smc-primary">{badge}</span> : null}
              {updatedAt ? <span className="text-xs text-smc-text-muted">Updated: {updatedAt}</span> : null}
            </div>
          </div>
          {stats?.length ? (
            <div className="grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="font-semibold text-slate-900">{stat.label}</p>
                  <p>{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-smc-primary/10 via-white to-smc-primary/5 p-6 shadow-inner">
          {heroImage ?? (
            <div className="flex h-48 w-full max-w-md items-center justify-center rounded-2xl border border-smc-border bg-white text-3xl font-semibold text-smc-primary">
              {heroTitle.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="space-y-3 rounded-[24px] border border-smc-border/70 bg-white/90 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-smc-text">{section.title}</h2>
          </div>
          <div className="space-y-3">{section.children}</div>
        </section>
      ))}
    </main>
  );
}
