"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import type { TransportCategoryCapacityKpiResponse } from "@/lib/kpi/transport-category-capacity";

type Props = { categorySlug: string; categoryName: string };

export function CapacityClient({ categorySlug, categoryName }: Props) {
  const { data, isLoading, isError } = useQuery<TransportCategoryCapacityKpiResponse>({
    queryKey: ["transport-category-capacity", categorySlug],
    queryFn: async () => {
      const res = await fetch(`/api/kpi/transport-means/${categorySlug}/capacity`);
      if (!res.ok) throw new Error("Failed to load capacity KPIs");
      const json = (await res.json()) as { data: TransportCategoryCapacityKpiResponse };
      return json.data;
    },
    staleTime: 60_000,
  });

  const cards = data?.cards;
  const charts = data?.charts;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
        <div>
          <p className="text-sm text-smc-textMuted">Capacity & Performance</p>
          <h1 className="text-2xl font-semibold text-smc-primary">{categoryName}</h1>
        </div>
      </div>

      {isError ? <p className="text-sm text-red-600">Failed to load KPIs.</p> : null}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Total load (kg)" value={cards ? formatNumber(cards.totalLoadKg) : "—"} />
        <MetricTile label="Avg load (kg)" value={cards ? cards.avgLoadKg.toFixed(1) : "—"} />
        <MetricTile label="Avg cruise speed" value={cards ? cards.avgCruiseSpeed.toFixed(1) : "—"} />
        <MetricTile label="Avg max speed" value={cards ? cards.avgMaxSpeed.toFixed(1) : "—"} />
        <MetricTile label="Speed spread" value={cards ? cards.speedSpread.toFixed(1) : "—"} helper="Max - min" />
        <MetricTile label="Outliers" value={cards ? formatNumber(cards.outliers) : "—"} helper="Zero capacity or speed" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Load vs Max speed" description="Scatter to detect outliers">
          {charts?.scatter.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="loadCapacityKg" name="Load (kg)" />
                <YAxis dataKey="maxSpeedKmh" name="Max speed (km/h)" />
                <Tooltip />
                <Scatter data={charts.scatter} fill="rgb(var(--smc-primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Avg load by plant" description="Average load capacity per transport mean">
          {charts?.avgLoadByPlant.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.avgLoadByPlant}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plantName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgLoad" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Max speed distribution" description="Histogram of max speed">
          {charts?.speedHistogram.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.speedHistogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="rgba(20,36,64,0.7)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center rounded-md bg-slate-50 text-sm text-smc-textMuted">{label}</div>;
}

function formatNumber(value: number | string | undefined) {
  if (value === undefined) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US").format(num);
}
