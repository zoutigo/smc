"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import type { TransportCategoryFlowsKpiResponse } from "@/lib/kpi/transport-category-flows";

type Props = { categorySlug: string; categoryName: string };

export function FlowsClient({ categorySlug, categoryName }: Props) {
  const { data, isLoading, isError } = useQuery<TransportCategoryFlowsKpiResponse>({
    queryKey: ["transport-category-flows", categorySlug],
    queryFn: async () => {
      const res = await fetch(`/api/kpi/transport-means/${categorySlug}/flows`);
      if (!res.ok) throw new Error("Failed to load flow KPIs");
      const json = (await res.json()) as { data: TransportCategoryFlowsKpiResponse };
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
          <p className="text-sm text-smc-textMuted">Flow coverage</p>
          <h1 className="text-2xl font-semibold text-smc-primary">{categoryName}</h1>
        </div>
      </div>

      {isError ? <p className="text-sm text-red-600">Failed to load KPIs.</p> : null}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Distinct flows" value={cards ? formatNumber(cards.distinctFlows) : "—"} />
        <MetricTile label="Mono-flow" value={cards ? formatNumber(cards.monoFlow) : "—"} />
        <MetricTile label="Multi-flow" value={cards ? formatNumber(cards.multiFlow) : "—"} />
        <MetricTile label="No main flow" value={cards ? formatNumber(cards.withoutMainFlow) : "—"} />
        <MetricTile label="No pivot flows" value={cards ? formatNumber(cards.withoutPivot) : "—"} />
        <MetricTile label="Top flow" value={cards?.topFlow?.slug ?? "—"} helper={cards?.topFlow ? `${cards.topFlow.count} tm` : undefined} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Transport means by main flow" description="Using primary flowId">
          {charts?.countByMainFlow.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.countByMainFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="slug" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Transport means by pivot flow" description="Using TransportMeanFlow pivot">
          {charts?.countByPivotFlow.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={charts.countByPivotFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="slug" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
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
