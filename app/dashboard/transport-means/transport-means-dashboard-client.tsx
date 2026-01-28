"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import type { TransportKpiResponse } from "@/lib/kpi/transport-means";

type Option = { value: string; label: string };

type Props = {
  plants: Option[];
  categories: Option[];
};

const numberFormatter = new Intl.NumberFormat("en-US");

export function TransportMeansDashboardClient({ plants, categories }: Props) {
  const [filters, setFilters] = useState<{ plantId: string; categorySlug: string }>({ plantId: "", categorySlug: "" });

  const query = useQuery<TransportKpiResponse>({
    queryKey: ["transport-kpis", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.plantId) params.set("plantId", filters.plantId);
      if (filters.categorySlug) params.set("categorySlug", filters.categorySlug);

      const empty: TransportKpiResponse = {
        overview: { countTransportMeans: 0, countCategories: 0, countPlants: 0, totalLoadCapacityKg: 0, avgMaxSpeedKmh: 0, packagingCoverage: 0, flowsCoverage: 0, multiFlowCount: 0 },
        charts: { countByCategory: [], capacityByPlant: [], capacityByCategory: [], supplierDonut: [], capacitySpeedScatter: [] },
        table: [],
      };

      try {
        const response = await fetch(`/api/kpi/transport-means?${params.toString()}`);
        if (!response.ok) {
          return empty;
        }
        const json = (await response.json()) as { data: TransportKpiResponse };
        return json.data ?? empty;
      } catch {
        return empty;
      }
    },
    staleTime: 60_000,
  });

  const overview = query.data?.overview;
  const charts = query.data?.charts;
  const table = query.data?.table ?? [];

  const filtersApplied = useMemo(
    () => ({
      plantLabel: plants.find((p) => p.value === filters.plantId)?.label ?? "All plants",
      categoryLabel: categories.find((c) => c.value === filters.categorySlug)?.label ?? "All categories",
    }),
    [filters.plantId, filters.categorySlug, plants, categories]
  );

  const donutColors = ["rgb(var(--smc-primary))", "rgb(var(--smc-secondary))", "rgba(20,36,64,0.55)", "rgba(46,204,113,0.85)"];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-smc-textMuted">Dashboard</p>
            <h1 className="text-2xl font-semibold text-smc-primary">Transport means overview</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Plant"
              value={filters.plantId}
              options={[{ value: "", label: "All" }, ...plants]}
              onChange={(value) => setFilters((prev) => ({ ...prev, plantId: value }))}
            />
            <FilterSelect
              label="Category"
              value={filters.categorySlug}
              options={[{ value: "", label: "All" }, ...categories]}
              onChange={(value) => setFilters((prev) => ({ ...prev, categorySlug: value }))}
            />
          </div>
        </div>

        <p className="text-sm text-smc-textMuted">
          Filters: {filtersApplied.plantLabel} · {filtersApplied.categoryLabel}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="# Transport means" value={overview ? numberFormatter.format(overview.countTransportMeans) : "—"} />
        <MetricTile label="# Categories" value={overview ? numberFormatter.format(overview.countCategories) : "—"} />
        <MetricTile label="# Plants" value={overview ? numberFormatter.format(overview.countPlants) : "—"} />
        <MetricTile label="Total load (kg)" value={overview ? numberFormatter.format(Math.round(overview.totalLoadCapacityKg)) : "—"} />
        <MetricTile
          label="Avg max speed (km/h)"
          value={overview ? overview.avgMaxSpeedKmh.toFixed(1) : "—"}
          helper="Weighted by units"
        />
        <MetricTile label="Packaging coverage" value={overview ? numberFormatter.format(overview.packagingCoverage) : "—"} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="# transport means by category" description="Count per transport category">
          {charts?.countByCategory.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.countByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoryName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Load capacity by plant (kg)" description="Σ loadCapacityKg * units">
          {charts?.capacityByPlant.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.capacityByPlant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="loadTotal" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Load capacity by category (kg)" description="Σ loadCapacityKg * units">
          {charts?.capacityByCategory.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.capacityByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoryName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="loadTotal" fill="rgba(20,36,64,0.7)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Supplier distribution" description="Share of transport means per supplier">
          {charts?.supplierDonut.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={charts.supplierDonut} dataKey="count" nameKey="supplierName" cx="50%" cy="50%" outerRadius={80} label>
                  {charts.supplierDonut.map((entry, index) => (
                    <Cell key={entry.supplierName} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Load capacity vs max speed" description="Spot outliers by capacity and speed">
          {charts?.capacitySpeedScatter.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="loadCapacityKg" name="Load (kg)" />
                <YAxis dataKey="maxSpeedKmh" name="Max speed (km/h)" />
                <Tooltip />
                <Scatter data={charts.capacitySpeedScatter} fill="rgb(var(--smc-primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={query.isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </section>

      <section className="rounded-[var(--smc-radius-lg)] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-smc-textMuted">Ranking</p>
            <h2 className="text-lg font-semibold text-smc-text">Top 20 transport means by load capacity</h2>
          </div>
          <Link href="/transport-means" className="text-sm text-smc-primary hover:underline">
            Go to catalogue
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-smc-textMuted">
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Plant</th>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-left">Supplier</th>
                <th className="px-2 py-2 text-right">Load (kg)</th>
                <th className="px-2 py-2 text-right">Units</th>
                <th className="px-2 py-2 text-right">Total load (kg)</th>
                <th className="px-2 py-2 text-right">Max speed</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-semibold text-smc-text">{row.name}</td>
                  <td className="px-2 py-2 text-smc-text">{row.plantName ?? "—"}</td>
                  <td className="px-2 py-2 text-smc-text">{row.categoryName}</td>
                  <td className="px-2 py-2 text-smc-text">{row.supplierName ?? "—"}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{numberFormatter.format(row.loadCapacityKg)}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{numberFormatter.format(row.units)}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{numberFormatter.format(row.loadTotal)}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{row.maxSpeedKmh.toFixed(1)}</td>
                </tr>
              ))}
              {!table.length && !query.isLoading ? (
                <tr>
                  <td className="px-2 py-4 text-sm text-smc-textMuted" colSpan={8}>
                    No data available for these filters.
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md bg-slate-50 text-sm text-smc-textMuted">
      {label}
    </div>
  );
}
