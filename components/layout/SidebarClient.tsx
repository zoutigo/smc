"use client";

import { useEffect, useMemo, useState } from "react";
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
  transportCategories: SidebarClientCategory[];
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

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "text-white/70",
} as const;

const HomeIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h4v-6h6v6h4V10" />
  </svg>
);

const BoxIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M3 7 12 3l9 4-9 4-9-4Z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </svg>
);

const WarehouseIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M3 20V9.5L12 5l9 4.5V20" />
    <path d="M7 20v-6h10v6" />
    <path d="M10 20v-4h4v4" />
  </svg>
);

const TruckIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M3 5h11v10H3Z" />
    <path d="M14 8h3l3 3v4h-2.5" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

const ChartIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M4 19V5" />
    <path d="M20 19H4" />
    <path d="M8 19V9" />
    <path d="M12 19V7" />
    <path d="M16 19v-4" />
  </svg>
);

const LeafIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M20 4c-8 0-14 6-14 14" />
    <path d="M4 18c6 0 11-5 11-11" />
    <path d="M10 22c0-3.5 3-6 6-6" />
  </svg>
);

const UsersIcon = () => (
  <svg {...iconProps} aria-hidden>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="3" />
    <path d="M4 21v-1a5 5 0 0 1 5-5h2" />
    <path d="M14 15h2a4 4 0 0 1 4 4v2" />
  </svg>
);

const defaultIcon = () => <span className="h-2 w-2 rounded-full bg-white/30 shadow-[0_0_0_4px_rgba(255,255,255,0.06)]" aria-hidden />;

export default function SidebarClient({ storageCategories, packagingCategories, transportCategories }: SidebarClientProps) {
  const pathname = usePathname() ?? "";
  const { sidebarCollapsed } = useUIStore();
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const [dashboardPackagingOpen, setDashboardPackagingOpen] = useState(false);
  const [dashboardTransportOpen, setDashboardTransportOpen] = useState(false);
  const [storageMenuOpen, setStorageMenuOpen] = useState(false);
  const [packagingMenuOpen, setPackagingMenuOpen] = useState(false);
  const [transportMenuOpen, setTransportMenuOpen] = useState(false);
  const [storageCats, setStorageCats] = useState(storageCategories);
  const [packagingCats, setPackagingCats] = useState(packagingCategories);
  const [transportCats, setTransportCats] = useState(transportCategories);

  useEffect(() => {
    let cancelled = false;
    const hasAll = storageCats.length > 0 && packagingCats.length > 0 && transportCats.length > 0;
    if (hasAll) return;

    const load = async () => {
      try {
        const res = await fetch("/api/sidebar/categories");
        if (!res || !res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data?.storageCategories)) setStorageCats(data.storageCategories);
        if (Array.isArray(data?.packagingCategories)) setPackagingCats(data.packagingCategories);
        if (Array.isArray(data?.transportCategories)) setTransportCats(data.transportCategories);
      } catch (error) {
        console.error("Sidebar categories fetch failed", error);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasStorageCategories = storageCats.length > 0;
  const hasPackagingCategories = packagingCats.length > 0;
  const hasTransportCategories = transportCats.length > 0;
  const dashboardLinks = [
    { label: "Packaging means", href: "/dashboard/packaging-means", hasCategories: true },
    { label: "Transport means", href: "/dashboard/transport-means", hasCategories: true, type: "transport" as const },
  ];

  const renderStorageSubmenu = storageMenuOpen && hasStorageCategories && !sidebarCollapsed;
  const renderPackagingSubmenu = packagingMenuOpen && hasPackagingCategories && !sidebarCollapsed;
  const renderTransportSubmenu = transportMenuOpen && hasTransportCategories && !sidebarCollapsed;
  const renderDashboardSubmenu = dashboardMenuOpen && !sidebarCollapsed;

  const storageLinkHref = "/storage-means" as const;
  const packagingLinkHref = "/packaging-means" as const;
  const transportLinkHref = "/transport-means" as const;
  const dashboardHref = "/dashboard" as const;

  const iconMap = useMemo(
    () => ({
      "/": HomeIcon,
      "/packaging-means": BoxIcon,
      "/storage-means": WarehouseIcon,
      "/transport-means": TruckIcon,
      "/dashboard": ChartIcon,
      "/plants": LeafIcon,
      "/users": UsersIcon,
    }),
    []
  );

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
          const isDashboardLink = it.href === dashboardHref;
          const isStorageLink = it.href === storageLinkHref;
          const isPackagingLink = it.href === packagingLinkHref;
          const isTransportLink = it.href === transportLinkHref;
          const Icon = iconMap[it.href] ?? defaultIcon;

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
                  <Icon />
                  <span className={cx(sidebarCollapsed && "sr-only")}>{it.label}</span>
                </Link>
                {isDashboardLink && !sidebarCollapsed ? (
                  <button
                    type="button"
                    aria-label={dashboardMenuOpen ? "Hide dashboard links" : "Show dashboard links"}
                    aria-expanded={renderDashboardSubmenu}
                    className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDashboardMenuOpen((open) => !open);
                    }}
                  >
                    <ChevronIcon open={dashboardMenuOpen} />
                  </button>
                ) : null}
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
                {isTransportLink && !sidebarCollapsed ? (
                  <button
                    type="button"
                    aria-label={transportMenuOpen ? "Hide transport categories" : "Show transport categories"}
                    aria-expanded={renderTransportSubmenu}
                    className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer disabled:opacity-40"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setTransportMenuOpen((open) => !open);
                    }}
                    disabled={!hasTransportCategories}
                  >
                    <ChevronIcon open={transportMenuOpen && hasTransportCategories} />
                  </button>
                ) : null}
              </div>
              {isDashboardLink && renderDashboardSubmenu ? (
                <div
                  className="mt-1 ml-3 space-y-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 backdrop-blur"
                  role="group"
                  aria-label="Dashboard links"
                >
                  {dashboardLinks.map((link) => {
                    const showChildToggle =
                      link.hasCategories && (link.type === "transport" ? hasTransportCategories : hasPackagingCategories);
                    return (
                      <div key={link.href} className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Link
                            href={link.href}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                          >
                            {link.label}
                          </Link>
                          {showChildToggle ? (
                            <button
                              type="button"
                              aria-label={
                                link.type === "transport"
                                  ? dashboardTransportOpen
                                    ? "Hide transport dashboards"
                                    : "Show transport dashboards"
                                  : dashboardPackagingOpen
                                  ? "Hide packaging dashboards"
                                  : "Show packaging dashboards"
                              }
                              aria-expanded={link.type === "transport" ? dashboardTransportOpen : dashboardPackagingOpen}
                              className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (link.type === "transport") setDashboardTransportOpen((open) => !open);
                                else setDashboardPackagingOpen((open) => !open);
                              }}
                            >
                              <ChevronIcon open={link.type === "transport" ? dashboardTransportOpen : dashboardPackagingOpen} />
                            </button>
                          ) : null}
                        </div>
                        {showChildToggle && ((link.type === "transport" && dashboardTransportOpen) || (!link.type && dashboardPackagingOpen)) ? (
                          <div className="mt-1 ml-3 space-y-1 rounded-md bg-white/5 px-2 py-2 text-sm text-white/80 ring-1 ring-white/10">
                            {(link.type === "transport" ? transportCategories : packagingCategories).map((category) => (
                              <Link
                                key={category.id}
                                href={`/dashboard/${link.type === "transport" ? "transport-means" : "packaging-means"}/${category.slug}`}
                                className="block cursor-pointer rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-white"
                              >
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {isStorageLink && renderStorageSubmenu ? (
                <div className="mt-1 ml-3 space-y-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 backdrop-blur" role="group" aria-label="Storage mean categories">
                  {storageCats.map((category) => (
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
                <div className="mt-1 ml-3 space-y-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 backdrop-blur" role="group" aria-label="Packaging categories">
                  {packagingCats.map((category) => (
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
              {isTransportLink && renderTransportSubmenu ? (
                <div className="mt-1 ml-3 space-y-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 backdrop-blur" role="group" aria-label="Transport categories">
                  {transportCats.map((category) => (
                    <Link
                      key={category.id}
                      href={`${transportLinkHref}/${category.slug}`}
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
