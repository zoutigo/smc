"use client";

import React from "react";
import Image from "next/image";

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10 13a5 5 0 0 0 7.54.54l1.96-1.96a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-1.96 1.96a5 5 0 0 0 7.07 7.07l1.72-1.71" />
  </svg>
);

type TransportCategoryCardProps = {
  name: string;
  description: string | null;
  imageUrl?: string | null;
  href: string;
  slug?: string;
};

const fallbackImages: Record<string, string> = {
  "agv-amr": "https://images.unsplash.com/photo-1527443224154-d12d1dc13ca8?auto=format&fit=crop&w=1200&q=80",
  forklift: "https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=1200&q=80",
  "tugger-train": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
};

export default function TransportCategoryCard({ name, description, imageUrl, href, slug }: TransportCategoryCardProps) {
  const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
  const normalizedSlug = slug?.toLowerCase() ?? name.toLowerCase().replace(/\s+/g, "-");
  const fallbackImageUrl = fallbackImages[normalizedSlug] ?? fallbackImages.forklift;
  const truncatedDescription = (description ?? "No description.").length > 120
    ? `${(description ?? "No description.").slice(0, 117)}…`
    : (description ?? "No description.");

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
          <Image
            src={fallbackImageUrl}
            alt={`${name} image`}
            width={640}
            height={360}
            className="h-44 w-full object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
            unoptimized
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" aria-hidden />
      </div>

      <div className="relative flex-1 space-y-3 px-5 py-4 text-sm text-smc-text">
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <p className="leading-relaxed text-smc-text/90" data-testid="transport-description">
          {truncatedDescription}
        </p>
      </div>

      <div data-testid="transport-card-footer" className="relative flex items-center justify-between border-t border-smc-border/60 bg-gradient-to-r from-white via-smc-bg/70 to-white px-5 py-3">
        <span className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.35em] text-smc-primary" data-testid="transport-label">
          TRANSPORT
        </span>
        <a
          href={href}
          aria-label="View transport mean category"
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-smc-border bg-white text-smc-primary/80 transition hover:-translate-y-[1px] hover:bg-smc-primary/10"
        >
          <LinkIcon />
        </a>
      </div>
    </article>
  );
}
