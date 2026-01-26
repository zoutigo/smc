"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PackagingCategoryKpiResponse } from "@/lib/kpi/packaging-category";

type Option = { value: string; label: string };

type CategoryDashboardClientProps = {
  category: { id: string; name: string; slug: string; description: string | null };
  plants: Option[];
  flows: Option[];
};

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DRAFT", label: "Draft" },
  { value: "ALL", label: "All" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const tabs = [
  { slug: "overview", label: "Overview" },
  { slug: "cost", label: "Cost" },
  { slug: "capacity", label: "Capacity & Density" },
  { slug: "parts", label: "Parts coverage" },
  { slug: "accessories", label: "Accessories" },
] as const;

type TabSlug = (typeof tabs)[number]["slug"];

export function CategoryDashboardClient({ category, plants, flows }: CategoryDashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState({
    plantId: searchParams.get("plantId") ?? "",
    flowId: searchParams.get("flowId") ?? "",
    status: searchParams.get("status") ?? "ACTIVE",
  });

  const currentTab = (pathname?.split("/").at(-1) ?? "overview") as TabSlug;
  const resolvedTab: TabSlug = tabs.find((t) => pathname.endsWith(t.slug)) ? (currentTab as TabSlug) : "overview";

  const { data, isLoading, isError } = useQuery<PackagingCategoryKpiResponse>({
    queryKey: ["packaging-category-kpi", category.slug, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.plantId) params.set("plantId", filters.plantId);
      if (filters.flowId) params.set("flowId", filters.flowId);
      if (filters.status) params.set("status", filters.status);
      const res = await fetch(`/api/kpi/packaging-means/${category.slug}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = (await res.json()) as { data: PackagingCategoryKpiResponse };
      return json.data;
    },
    staleTime: 60_000,
  });

  const headerFilters = useMemo(
    () => ({
      plant: plants.find((p) => p.value === filters.plantId)?.label ?? "All plants",
      flow: flows.find((f) => f.value === filters.flowId)?.label ?? "All flows",
      status: statusOptions.find((s) => s.value === filters.status)?.label ?? "Active",
    }),
    [filters.flowId, filters.plantId, filters.status, flows, plants]
  );

  const onFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    const params = new URLSearchParams(searchParams?.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const contentByTab: Record<TabSlug, JSX.Element> = {
    overview: data ? <OverviewTab data={data} loading={isLoading} /> : <LoadingState />,
    cost: data ? <CostTab data={data} loading={isLoading} /> : <LoadingState />,
    capacity: data ? <CapacityTab data={data} loading={isLoading} /> : <LoadingState />,
    parts: data ? <PartsTab data={data} loading={isLoading} /> : <LoadingState />,
    accessories: data ? <AccessoriesTab data={data} loading={isLoading} /> : <LoadingState />,
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
        <div>
          <p className="text-sm text-smc-textMuted">Packaging category dashboard</p>
          <h1 className="text-2xl font-semibold text-smc-primary">{category.name}</h1>
          {category.description ? <p className="text-sm text-smc-textMuted">{category.description}</p> : null}
          <p className="text-xs text-smc-textMuted">
            Filters: {headerFilters.plant} · {headerFilters.flow} · {headerFilters.status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Plant"
            value={filters.plantId}
            options={[{ value: "", label: "All" }, ...plants]}
            onChange={(value) => onFilterChange("plantId", value)}
          />
          <FilterSelect
            label="Flow"
            value={filters.flowId}
            options={[{ value: "", label: "All" }, ...flows]}
            onChange={(value) => onFilterChange("flowId", value)}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            options={statusOptions}
            onChange={(value) => onFilterChange("status", value || "ACTIVE")}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const href =
            tab.slug === "overview"
              ? `/dashboard/packaging-means/${category.slug}`
              : `/dashboard/packaging-means/${category.slug}/${tab.slug}`;
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

function OverviewTab({ data, loading }: { data: PackagingCategoryKpiResponse; loading: boolean }) {
  const o = data.overview;
  const charts = data.overviewCharts;
  const table = data.overviewTable;
  const storage = data.storage;
  const concentrationPct = storage.concentrationTop3.reduce((sum, row) => sum + row.pct, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="# Packaging means" value={formatNumber(o.countPackagingMeans)} />
        <MetricTile label="# Plants" value={formatNumber(o.countPlants)} />
        <MetricTile label="Full parc value" value={formatCurrency(o.totalFullValue)} />
        <MetricTile label="Total volume (m³)" value={o.totalVolume.toFixed(2)} />
        <MetricTile label="Total capacity" value={formatNumber(o.totalCapacity)} />
        <MetricTile label="Avg €/capacity" value={o.avgEuroPerCapacity.toFixed(0)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="# Storage means" value={formatNumber(storage.storageMeansHosting)} helper="Hébergent cette catégorie" />
        <MetricTile label="Qty stockée" value={formatNumber(storage.totalQtyStored)} />
        <MetricTile
          label="Top plant (qty)"
          value={storage.topPlants[0]?.plant ?? "—"}
          helper={storage.topPlants[0] ? formatNumber(storage.topPlants[0].qty) : undefined}
        />
        <MetricTile
          label="Concentration Top3"
          value={`${concentrationPct.toFixed(1)}%`}
          helper={storage.concentrationTop3.map((c) => c.storageMean).join(", ") || undefined}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Full value by plant" description="Packaging + accessories">
          {charts.valueByPlant.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.valueByPlant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="fullValue" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Stocked qty by plant" description="Où est stockée cette catégorie">
          {storage.topPlants.length ? (
            <ResponsiveContainer>
              <BarChart data={storage.topPlants}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plant" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatNumber(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="qty" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Capacity by plant" description="Total parts capacity">
          {charts.capacityByPlant.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.capacityByPlant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatNumber(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="capacity" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Unit volume distribution" description="Histogram of unit volumes">
          {charts.volumeHistogram.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.volumeHistogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="rgba(18,54,104,0.8)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-smc-primary">Top packaging means</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-smc-textMuted">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Plant</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Volume (m³)</th>
                <th className="px-3 py-2">Capacity</th>
                <th className="px-3 py-2">Full value</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.plant}</td>
                  <td className="px-3 py-2">{row.supplier}</td>
                  <td className="px-3 py-2">{formatCurrency(row.price)}</td>
                  <td className="px-3 py-2">{row.numberOfPackagings}</td>
                  <td className="px-3 py-2">{row.volumeUnit.toFixed(2)}</td>
                  <td className="px-3 py-2">{row.capacityUnit}</td>
                  <td className="px-3 py-2">{formatCurrency(row.fullParkValue)}</td>
                </tr>
              ))}
              {!table.length ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-smc-textMuted" colSpan={8}>
                    {loading ? "Loading..." : "No packaging means."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function CostTab({ data, loading }: { data: PackagingCategoryKpiResponse; loading: boolean }) {
  const c = data.cost.cards;
  const charts = data.cost.charts;
  const table = data.cost.table;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Parc value (packaging)" value={formatCurrency(c.valuePackaging)} />
        <MetricTile label="Parc value (accessories)" value={formatCurrency(c.valueAccessories)} />
        <MetricTile label="Parc value (full)" value={formatCurrency(c.valueFull)} />
        <MetricTile label="Avg full unit cost" value={formatCurrency(c.avgFullUnitCost)} />
        <MetricTile label="Top supplier" value={c.topSupplier ?? "—"} />
        <MetricTile label="# price overrides" value={formatNumber(c.countAccessoryOverrides)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Value by plant (stacked)">
          {charts.valueByPlant.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.valueByPlant} stackOffset="none">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="packaging" stackId="a" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="accessories" stackId="a" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Value by supplier">
          {charts.valueBySupplier.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.valueBySupplier}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplierName" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="value" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Unit cost vs unit capacity">
          {charts.costVsCapacity.length ? (
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="fullUnitCost" name="Full unit cost" tickFormatter={(v) => formatCurrency(v).replace("€", "")} />
                <YAxis dataKey="capacityUnit" name="Capacity" />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | number | undefined) =>
                    name === "fullUnitCost"
                      ? formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
                      : formatNumber(typeof value === "number" ? value : Number(value ?? 0))
                  }
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.name ?? ""}
                />
                <Scatter data={charts.costVsCapacity} fill="rgb(var(--smc-primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-smc-primary">Cost breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-smc-textMuted">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Packaging €</th>
                <th className="px-3 py-2">Accessories €</th>
                <th className="px-3 py-2">Full unit €</th>
                <th className="px-3 py-2">Parc value</th>
                <th className="px-3 py-2">Parc accessories</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{formatCurrency(row.price)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.accessoriesUnit)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.fullUnitCost)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.parkValue)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.accessoriesParkValue)}</td>
                </tr>
              ))}
              {!table.length ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-smc-textMuted" colSpan={6}>
                    {loading ? "Loading..." : "No rows."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function CapacityTab({ data, loading }: { data: PackagingCategoryKpiResponse; loading: boolean }) {
  const c = data.capacity.cards;
  const charts = data.capacity.charts;
  const table = data.capacity.table;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Avg capacity/unit" value={c.avgCapacityUnit.toFixed(1)} />
        <MetricTile label="Total capacity" value={formatNumber(c.totalCapacity)} />
        <MetricTile label="Avg density (parts/m³)" value={c.avgDensity.toFixed(2)} />
        <MetricTile label="Top density" value={c.topDensity ? `${c.topDensity.name} (${c.topDensity.density.toFixed(2)})` : "—"} />
        <MetricTile label="# with no capacity" value={formatNumber(c.countNoCapacity)} />
        <MetricTile label="Median €/capacity" value={c.medianEuroPerCapacity.toFixed(0)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Top densities">
          {charts.densityTop.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.densityTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => {
                  const numeric = typeof value === "number" ? value : Number(value ?? 0);
                  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
                }} />
                <Bar dataKey="density" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Density vs full unit cost">
          {charts.densityVsCost.length ? (
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="density" name="Density" />
                <YAxis dataKey="fullUnitCost" name="Full unit cost" />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | number | undefined) =>
                    name === "fullUnitCost"
                      ? formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
                      : (() => {
                          const numeric = typeof value === "number" ? value : Number(value ?? 0);
                          return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
                        })()
                  }
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.name ?? ""}
                />
                <Scatter data={charts.densityVsCost} fill="rgb(var(--smc-primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Capacity by plant">
          {charts.capacityByPlant.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.capacityByPlant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatNumber(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="capacity" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-smc-primary">Capacity detail</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-smc-textMuted">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Capacity/unit</th>
                <th className="px-3 py-2">Volume (m³)</th>
                <th className="px-3 py-2">Density</th>
                <th className="px-3 py-2">€/capacity</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.capacityUnit}</td>
                  <td className="px-3 py-2">{row.volumeUnit.toFixed(2)}</td>
                  <td className="px-3 py-2">{row.density.toFixed(2)}</td>
                  <td className="px-3 py-2">{row.euroPerCapacity.toFixed(0)}</td>
                </tr>
              ))}
              {!table.length ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-smc-textMuted" colSpan={5}>
                    {loading ? "Loading..." : "No rows."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function PartsTab({ data, loading }: { data: PackagingCategoryKpiResponse; loading: boolean }) {
  const c = data.parts.cards;
  const charts = data.parts.charts;
  const table = data.parts.table;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="# Parts" value={formatNumber(c.distinctParts)} />
        <MetricTile label="Top part" value={c.topPart ?? "—"} />
        <MetricTile label="Avg parts / packaging" value={c.avgPartsPerPm.toFixed(1)} />
        <MetricTile label="Parts w/o project" value={formatNumber(c.partsWithoutProject)} />
        <MetricTile label="Part families" value={formatNumber(c.partFamilies)} />
        <MetricTile label="Mono vs multi" value={`${c.monoPartPct.toFixed(0)}% mono / ${c.multiPartPct.toFixed(0)}% multi`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Top parts (by # packaging means)">
          {charts.topParts.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.topParts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="partName" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Top part families">
          {charts.topPartFamilies.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.topPartFamilies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="partFamily" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-smc-primary">Parts coverage by plant x family</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-smc-textMuted">
              <tr>
                <th className="px-3 py-2">Plant</th>
                <th className="px-3 py-2">Part family</th>
                <th className="px-3 py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {charts.plantFamilyCoverage.map((row, idx) => (
                <tr key={`${row.plant}-${row.partFamily}-${idx}`} className="border-t">
                  <td className="px-3 py-2">{row.plant}</td>
                  <td className="px-3 py-2">{row.partFamily}</td>
                  <td className="px-3 py-2">{row.count}</td>
                </tr>
              ))}
              {!charts.plantFamilyCoverage.length ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-smc-textMuted" colSpan={3}>
                    {loading ? "Loading..." : "No rows."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-smc-primary">Parts matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-smc-textMuted">
              <tr>
                <th className="px-3 py-2">Part</th>
                <th className="px-3 py-2">Packaging means</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.partId} className="border-t align-top">
                  <td className="px-3 py-2 font-medium">{row.partName}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {row.packagingMeans.map((pm) => (
                        <div key={pm.id} className="rounded-md bg-slate-50 px-3 py-2">
                          <p className="font-medium">{pm.name}</p>
                          <p className="text-xs text-smc-textMuted">
                            Parts/pack: {pm.partsPerPackaging} · V pitch: {pm.verticalPitch ?? "—"} · H pitch:{" "}
                            {pm.horizontalPitch ?? "—"}
                          </p>
                          {pm.notes ? <p className="text-xs text-smc-textMuted">Notes: {pm.notes}</p> : null}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!table.length ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-smc-textMuted" colSpan={2}>
                    {loading ? "Loading..." : "No rows."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessoriesTab({ data, loading }: { data: PackagingCategoryKpiResponse; loading: boolean }) {
  const c = data.accessories.cards;
  const charts = data.accessories.charts;
  const table = data.accessories.table;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="# Accessories" value={formatNumber(c.distinctAccessories)} />
        <MetricTile label="Accessories value" value={formatCurrency(c.accessoriesValue)} />
        <MetricTile label="Avg accessory unit €" value={formatCurrency(c.avgAccessoryUnitCost)} />
        <MetricTile label="Top accessory" value={c.topAccessory ?? "—"} />
        <MetricTile label="% with accessories" value={`${c.pctWithAccessories.toFixed(0)}%`} />
        <MetricTile label="# price override" value={formatNumber(c.countPriceOverride)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Top accessories by value">
          {charts.topAccessories.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.topAccessories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="accessory" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="value" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="Accessories by supplier">
          {charts.accessoriesBySupplier.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.accessoriesBySupplier}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier" />
                <YAxis />
                <Tooltip formatter={(value: number | string | undefined) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
                <Bar dataKey="value" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
        <ChartCard title="With vs without accessories">
          {charts.donutWithAccessories.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={charts.donutWithAccessories} dataKey="count" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {charts.donutWithAccessories.map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? "rgb(var(--smc-secondary))" : "rgba(18,54,104,0.4)"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={loading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-smc-primary">Accessories detail</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-smc-textMuted">
              <tr>
                <th className="px-3 py-2">Packaging mean</th>
                <th className="px-3 py-2">Accessory</th>
                <th className="px-3 py-2">Qty/packaging</th>
                <th className="px-3 py-2">Unit price</th>
                <th className="px-3 py-2">Override?</th>
                <th className="px-3 py-2">Unit cost</th>
                <th className="px-3 py-2">Parc cost</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, idx) => (
                <tr key={`${row.packagingMeanId}-${idx}`} className="border-t">
                  <td className="px-3 py-2">{row.packagingMean}</td>
                  <td className="px-3 py-2">{row.accessory}</td>
                  <td className="px-3 py-2">{row.qtyPerPackaging}</td>
                  <td className="px-3 py-2">{formatCurrency(row.unitPrice)}</td>
                  <td className="px-3 py-2">{row.unitPriceOverride != null ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{formatCurrency(row.unitCost)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.parkCost)}</td>
                </tr>
              ))}
              {!table.length ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-smc-textMuted" colSpan={7}>
                    {loading ? "Loading..." : "No rows."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md bg-slate-50 text-sm text-smc-textMuted">
      {label}
    </div>
  );
}

function LoadingState() {
  return <p className="text-sm text-smc-textMuted">Loading KPI data…</p>;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}
