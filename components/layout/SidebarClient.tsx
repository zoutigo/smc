"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { nav } from "@/lib/constants/navigation";
import { useUIStore } from "@/lib/stores/ui-store";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type SidebarClientCategory = {
  id: string;
  name: string;
  slug: string;
};

type SidebarClientProps = {
  storageCategories: SidebarClientCategory[];
  packagingCategories: SidebarClientCategory[];
};

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cx("transition-transform", open && "rotate-180")}
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function SidebarClient({ storageCategories, packagingCategories }: SidebarClientProps) {
  const pathname = usePathname() ?? "";
  const { sidebarCollapsed } = useUIStore();
  const [storageMenuOpen, setStorageMenuOpen] = useState(false);
  const [packagingMenuOpen, setPackagingMenuOpen] = useState(false);
  const hasStorageCategories = storageCategories.length > 0;
  const hasPackagingCategories = packagingCategories.length > 0;

  const renderStorageSubmenu = storageMenuOpen && hasStorageCategories && !sidebarCollapsed;
  const renderPackagingSubmenu = packagingMenuOpen && hasPackagingCategories && !sidebarCollapsed;

  const storageLinkHref = "/storage-means" as const;
  const packagingLinkHref = "/packaging-means" as const;

  return (
    <aside
      className={cx(
        "relative flex min-h-screen flex-col border-r border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(180deg,#0e2447,#0a1a33)] text-white shadow-[6px_0_24px_rgba(10,26,51,0.2)] transition-[width]",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,226,168,0.08),transparent_36%)]" aria-hidden />

      <nav className="space-y-1 px-2 py-6">
        {nav.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          const isStorageLink = it.href === storageLinkHref;
          const isPackagingLink = it.href === packagingLinkHref;

          return (
            <div key={it.href} className="flex flex-col">
              <div className="flex items-center gap-1 rounded-xl px-1 py-0.5 transition hover:bg-white/5">
                <Link
                  href={it.href}
                  className={cx(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition flex-1",
                    active
                      ? "bg-white/15 text-white shadow-[0_12px_28px_rgba(0,0,0,0.08)] ring-1 ring-white/15"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-white/30 shadow-[0_0_0_4px_rgba(255,255,255,0.06)]" aria-hidden />
                  <span className={cx(sidebarCollapsed && "sr-only")}>{it.label}</span>
                </Link>
                {isStorageLink && !sidebarCollapsed ? (
                  <button
                    type="button"
                    aria-label={storageMenuOpen ? "Hide storage mean categories" : "Show storage mean categories"}
                    aria-expanded={renderStorageSubmenu}
                    className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer disabled:opacity-40"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setStorageMenuOpen((open) => !open);
                    }}
                    disabled={!hasStorageCategories}
                  >
                    <ChevronIcon open={storageMenuOpen && hasStorageCategories} />
                  </button>
                ) : null}
                {isPackagingLink && !sidebarCollapsed ? (
                  <button
                    type="button"
                    aria-label={packagingMenuOpen ? "Hide packaging categories" : "Show packaging categories"}
                    aria-expanded={renderPackagingSubmenu}
                    className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer disabled:opacity-40"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setPackagingMenuOpen((open) => !open);
                    }}
                    disabled={!hasPackagingCategories}
                  >
                    <ChevronIcon open={packagingMenuOpen && hasPackagingCategories} />
                  </button>
                ) : null}
              </div>
              {isStorageLink && renderStorageSubmenu ? (
                <div className="mt-1 space-y-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 backdrop-blur" role="group" aria-label="Storage mean categories">
                  {storageCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`${storageLinkHref}/${category.slug}`}
                      className="block cursor-pointer rounded-md px-2 py-1 text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              ) : null}
              {isPackagingLink && renderPackagingSubmenu ? (
                <div className="mt-1 space-y-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 backdrop-blur" role="group" aria-label="Packaging categories">
                  {packagingCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`${packagingLinkHref}/${category.slug}`}
                      className="block cursor-pointer rounded-md px-2 py-1 text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-2 pt-4 pb-6">
        <button className="w-full cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
          <span className={cx(sidebarCollapsed && "sr-only")}>Settings</span>
        </button>
      </div>
    </aside>
  );
}
