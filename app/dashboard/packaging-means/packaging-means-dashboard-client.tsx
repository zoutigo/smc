"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import type { PackagingKpiResponse } from "@/lib/kpi/packaging-means";

type Option = { value: string; label: string };

type PackagingMeansDashboardClientProps = {
  plants: Option[];
  flows: Option[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DRAFT", label: "Draft" },
  { value: "ALL", label: "All" },
];

type Filters = {
  plantId: string;
  flowId: string;
  status: string;
};

export function PackagingMeansDashboardClient({ plants, flows }: PackagingMeansDashboardClientProps) {
  const [filters, setFilters] = useState<Filters>({
    plantId: "",
    flowId: "",
    status: "ACTIVE",
  });

  const query = useQuery<PackagingKpiResponse>({
    queryKey: ["packaging-kpis", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.plantId) params.set("plantId", filters.plantId);
      if (filters.flowId) params.set("flowId", filters.flowId);
      if (filters.status) params.set("status", filters.status);

      const response = await fetch(`/api/kpi/packaging-means?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to load KPIs");
      }

      const json = (await response.json()) as { data: PackagingKpiResponse };
      return json.data;
    },
    staleTime: 60_000,
  });

  const overview = query.data?.overview;
  const charts = query.data?.charts;
  const categoryCards = query.data?.categories ?? [];

  const donutColors = ["rgb(var(--smc-primary))", "rgb(var(--smc-secondary))", "rgba(20,36,64,0.55)"];

  const filtersApplied = useMemo(
    () => ({
      plantLabel: plants.find((p) => p.value === filters.plantId)?.label ?? "All plants",
      flowLabel: flows.find((f) => f.value === filters.flowId)?.label ?? "All flows",
      statusLabel: statusOptions.find((s) => s.value === filters.status)?.label ?? "Active",
    }),
    [filters.flowId, filters.plantId, filters.status, flows, plants]
  );

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-smc-textMuted">Dashboard</p>
            <h1 className="text-2xl font-semibold text-smc-primary">Packaging means overview</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Plant"
              value={filters.plantId}
              options={[{ value: "", label: "All" }, ...plants]}
              onChange={(value) => setFilters((prev) => ({ ...prev, plantId: value }))}
            />
            <FilterSelect
              label="Flow"
              value={filters.flowId}
              options={[{ value: "", label: "All" }, ...flows]}
              onChange={(value) => setFilters((prev) => ({ ...prev, flowId: value }))}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              options={statusOptions}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value || "ACTIVE" }))}
            />
          </div>
        </div>

        <p className="text-sm text-smc-textMuted">
          Filters: {filtersApplied.plantLabel} · {filtersApplied.flowLabel} · {filtersApplied.statusLabel}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="# Packaging means" value={overview ? numberFormatter.format(overview.countPackagingMeans) : "—"} />
        <MetricTile label="# Categories" value={overview ? numberFormatter.format(overview.countCategories) : "—"} />
        <MetricTile
          label="Parc value (€)"
          value={overview ? currencyFormatter.format(overview.totalValueBase) : "—"}
          helper="Packaging only"
        />
        <MetricTile
          label="Parc full value (€)"
          value={overview ? currencyFormatter.format(overview.totalValueFull) : "—"}
          helper="Including accessories"
        />
        <MetricTile
          label="Total volume (m³)"
          value={overview ? overview.totalVolumeM3.toFixed(2) : "—"}
        />
        <MetricTile
          label="Total capacity (parts)"
          value={overview ? numberFormatter.format(overview.totalCapacity) : "—"}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Full parc value by category" description="€ full cost per packaging category">
          {charts?.valueByCategory.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.valueByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoryName" />
                <YAxis />
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    currencyFormatter.format(typeof value === "number" ? value : Number(value ?? 0))
                  }
                />
                <Bar dataKey="fullValue" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading chart..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Volume by category" description="Total parc volume (m³)">
          {charts?.volumeByCategory.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.volumeByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoryName" />
                <YAxis />
                <Tooltip
                  formatter={(value: number | string | undefined) => {
                    const numeric = typeof value === "number" ? value : Number(value ?? 0);
                    return Number.isFinite(numeric) ? `${numeric.toFixed(2)} m³` : "0.00 m³";
                  }}
                />
                <Bar dataKey="volumeM3" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading chart..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Unit price vs unit volume" description="Each point is a packaging mean">
          {charts?.priceVolumeScatter.length ? (
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="price" name="Price (€)" tickFormatter={(v) => currencyFormatter.format(v).replace("€", "")} />
                <YAxis dataKey="volumeUnitM3" name="Volume (m³)" tickFormatter={(v) => v.toFixed(2)} />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | number | undefined) =>
                    name === "volumeUnitM3"
                      ? `${(typeof value === "number" ? value : Number(value ?? 0)).toFixed(3)} m³`
                      : currencyFormatter.format(typeof value === "number" ? value : Number(value ?? 0))
                  }
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.name ?? ""}
                />
                <Scatter data={charts.priceVolumeScatter} fill="rgb(var(--smc-secondary))" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading chart..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Status split" description="Packaging means by status">
          {charts?.statusDonut.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={charts.statusDonut}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {charts.statusDonut.map((_, index) => (
                    <Cell key={index} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading chart..." : "No data"} />
          )}
        </ChartCard>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-smc-primary">Category cards</h2>
            <p className="text-sm text-smc-textMuted">Per-category value, volume, and capacity.</p>
          </div>
        </div>

        {query.isError ? (
          <p className="text-sm text-red-600">Unable to load KPI data.</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((category) => (
            <Link
              key={category.id}
              href={`/packaging-means/${category.slug}`}
              className="cursor-pointer"
            >
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg font-semibold text-smc-primary">
                    <span>{category.name}</span>
                    <span className="text-sm text-smc-textMuted">{numberFormatter.format(category.items)} items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-smc-text">
                  <div className="flex items-center justify-between">
                    <span className="text-smc-textMuted">Full value</span>
                    <span className="font-semibold">{currencyFormatter.format(category.fullValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-smc-textMuted">Volume</span>
                    <span className="font-semibold">{category.volumeM3.toFixed(2)} m³</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-smc-textMuted">Capacity</span>
                    <span className="font-semibold">{numberFormatter.format(category.capacity)} parts</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {!categoryCards.length && !query.isLoading ? (
            <Card className="p-6 text-sm text-smc-textMuted">No categories found for these filters.</Card>
          ) : null}
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md bg-slate-50 text-sm text-smc-textMuted">
      {label}
    </div>
  );
}
