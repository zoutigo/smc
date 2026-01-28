"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import type { TransportCategoryKpiResponse } from "@/lib/kpi/transport-category";

type Option = { value: string; label: string };

const tabs = [
  { slug: "overview", label: "Overview" },
  { slug: "capacity", label: "Capacity & Performance" },
  { slug: "packaging", label: "Packaging compatibility" },
  { slug: "flows", label: "Flows coverage" },
] as const;
type TabSlug = (typeof tabs)[number]["slug"];

type Props = {
  category: { id: string; name: string; slug: string; description: string | null };
  plants: Option[];
  flows: Option[];
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function CategoryDashboardClient({ category, plants }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState({
    plantId: searchParams.get("plantId") ?? "",
  });

  const currentTab = (pathname?.split("/").at(-1) ?? "overview") as TabSlug;
  const resolvedTab: TabSlug = tabs.find((t) => pathname.endsWith(t.slug)) ? (currentTab as TabSlug) : "overview";

  const { data, isLoading, isError } = useQuery<TransportCategoryKpiResponse>({
    queryKey: ["transport-category-kpi", category.slug, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.plantId) params.set("plantId", filters.plantId);
      const res = await fetch(`/api/kpi/transport-means/${category.slug}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = (await res.json()) as { data: TransportCategoryKpiResponse };
      return json.data;
    },
    staleTime: 60_000,
  });

  const headerFilters = useMemo(
    () => ({
      plant: plants.find((p) => p.value === filters.plantId)?.label ?? "All plants",
    }),
    [filters.plantId, plants]
  );

  const onFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    const params = new URLSearchParams(searchParams?.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const contentByTab: Record<TabSlug, JSX.Element> = {
    overview: data ? <OverviewTab data={data} loading={isLoading} categoryName={category.name} categorySlug={category.slug} /> : <LoadingState />,
    capacity: <TabFrame title="Capacity & Performance" />,
    packaging: <TabFrame title="Packaging compatibility" />,
    flows: <TabFrame title="Flows coverage" />,
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
        <div>
          <p className="text-sm text-smc-textMuted">Transport category dashboard</p>
          <h1 className="text-2xl font-semibold text-smc-primary">{category.name}</h1>
          {category.description ? <p className="text-sm text-smc-textMuted">{category.description}</p> : null}
          <p className="text-xs text-smc-textMuted">Filters: {headerFilters.plant}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Plant"
            value={filters.plantId}
            options={[{ value: "", label: "All" }, ...plants]}
            onChange={(value) => onFilterChange("plantId", value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const href = tab.slug === "overview" ? `/dashboard/transport-means/${category.slug}` : `/dashboard/transport-means/${category.slug}/${tab.slug}`;
          const active = resolvedTab === tab.slug;
          return (
            <Link
              key={tab.slug}
              href={href}
              className={`relative cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border border-smc-primary bg-white text-smc-primary shadow-sm shadow-smc-primary/30"
                  : "border border-transparent bg-slate-100 text-smc-text/80 hover:border-smc-primary/40 hover:text-smc-primary"
              }`}
            >
              {tab.label}
              {active ? <span className="absolute inset-x-2 -bottom-1 block h-0.5 rounded-full bg-smc-primary/70" aria-hidden /> : null}
            </Link>
          );
        })}
      </div>

      {isError ? <p className="text-sm text-red-600">Failed to load KPIs.</p> : null}
      {contentByTab[resolvedTab]}
    </div>
  );
}

function OverviewTab({
  data,
  loading,
  categoryName,
  categorySlug,
}: {
  data: TransportCategoryKpiResponse;
  loading: boolean;
  categoryName: string;
  categorySlug: string;
}) {
  const o = data.overview;
  const charts = data.charts;
  const table = data.table;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="# Transport means" value={formatNumber(o.countTransportMeans)} />
        <MetricTile label="Total units" value={formatNumber(o.totalUnits)} />
        <MetricTile label="Total load (kg)" value={formatNumber(o.totalLoadKg)} />
        <MetricTile label="Avg load per unit" value={o.avgLoadPerUnit.toFixed(1)} />
        <MetricTile label="Avg max speed" value={o.avgMaxSpeedKmh.toFixed(1)} helper="Weighted by units" />
        <MetricTile label="Packaging compat." value={formatNumber(o.packagingCompatibility)} helper="Distinct packaging means" />
        <MetricTile label="Flows couverts" value={formatNumber(o.flowsCovered)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Load capacity by plant" description="Σ loadCapacityKg * units">
          {charts.loadByPlant.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.loadByPlant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="loadTotal" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Units by plant" description="Total units per plant">
          {charts.unitsByPlant.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.unitsByPlant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="units" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Packaging compatible (Top 10)" description="Number of packaging per transport mean">
          {charts.packagingPerMean.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.packagingPerMean}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="packagingCount" fill="rgba(20,36,64,0.8)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Load distribution" description="Histogram of load capacity">
          {charts.loadHistogram.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.loadHistogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>

      <section className="rounded-[var(--smc-radius-lg)] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-smc-textMuted">Listing</p>
            <h2 className="text-lg font-semibold text-smc-text">Transport means in {categoryName}</h2>
          </div>
          <Link href={`/transport-means/${categorySlug}`} className="text-sm text-smc-primary hover:underline">
            Go to catalogue
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-smc-textMuted">
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Plant</th>
                <th className="px-2 py-2 text-left">Supplier</th>
                <th className="px-2 py-2 text-right">Packaging</th>
                <th className="px-2 py-2 text-right">Flows</th>
                <th className="px-2 py-2 text-right">Load (kg)</th>
                <th className="px-2 py-2 text-right">Units</th>
                <th className="px-2 py-2 text-right">Max speed</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-semibold text-smc-text">{row.name}</td>
                  <td className="px-2 py-2 text-smc-text">{row.plantName ?? "—"}</td>
                  <td className="px-2 py-2 text-smc-text">{row.supplierName ?? "—"}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{formatNumber(row.packagingCount)}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{formatNumber(row.flowsCount)}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{formatNumber(row.loadCapacityKg)}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{formatNumber(row.units)}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{row.maxSpeedKmh.toFixed(1)}</td>
                </tr>
              ))}
              {!table.length && !loading ? (
                <tr>
                  <td className="px-2 py-4 text-sm text-smc-textMuted" colSpan={8}>
                    No data available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-smc-textMuted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-smc-text shadow-sm focus:outline-none focus:ring-2 focus:ring-smc-secondary"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LoadingState() {
  return <div className="rounded-md bg-white p-6 text-sm text-smc-textMuted shadow-card">Loading...</div>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md bg-slate-50 text-sm text-smc-textMuted">
      {label}
    </div>
  );
}

function formatNumber(value: number | string | undefined) {
  if (value === undefined) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "—";
  return numberFormatter.format(num);
}

function TabFrame({ title }: { title: string }) {
  return (
    <div className="rounded-md bg-white p-6 text-sm text-smc-textMuted shadow-card">
      <p className="font-semibold text-smc-text">{title}</p>
      <p>Select this tab in the navigation to load detailed KPIs.</p>
    </div>
  );
}
