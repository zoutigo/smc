"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import type { TransportCategoryPackagingKpiResponse } from "@/lib/kpi/transport-category-packaging";

type Props = { categorySlug: string; categoryName: string };

const donutColors = ["rgb(var(--smc-primary))", "rgb(var(--smc-secondary))"];

export function PackagingClient({ categorySlug, categoryName }: Props) {
  const { data, isLoading, isError } = useQuery<TransportCategoryPackagingKpiResponse>({
    queryKey: ["transport-category-packaging", categorySlug],
    queryFn: async () => {
      const res = await fetch(`/api/kpi/transport-means/${categorySlug}/packaging`);
      if (!res.ok) throw new Error("Failed to load packaging KPIs");
      const json = (await res.json()) as { data: TransportCategoryPackagingKpiResponse };
      return json.data;
    },
    staleTime: 60_000,
  });

  const cards = data?.cards;
  const charts = data?.charts;
  const table = data?.table ?? [];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
        <div>
          <p className="text-sm text-smc-textMuted">Packaging compatibility</p>
          <h1 className="text-2xl font-semibold text-smc-primary">{categoryName}</h1>
        </div>
      </div>

      {isError ? <p className="text-sm text-red-600">Failed to load KPIs.</p> : null}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Packaging distinct" value={cards ? formatNumber(cards.packagingDistinct) : "—"} />
        <MetricTile label="Top packaging" value={cards?.topPackaging?.name ?? "—"} helper={cards?.topPackaging ? `${cards.topPackaging.count} links` : undefined} />
        <MetricTile label="Avg max qty" value={cards ? cards.avgMaxQty.toFixed(1) : "—"} />
        <MetricTile label="% with part link" value={cards ? `${cards.withPartLinkPct.toFixed(1)}%` : "—"} />
        <MetricTile label="Zero qty links" value={cards ? formatNumber(cards.zeroQtyLinks) : "—"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Top packaging (count links)" description="Most supported packaging means">
          {charts?.topPackaging.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.topPackaging}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Top transport means by carry capacity" description="Σ maxQty per transport mean">
          {charts?.topCapacity.length ? (
            <ResponsiveContainer>
              <BarChart data={charts.topCapacity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="transportMeanName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="capacity" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>

        <ChartCard title="Links with/without part link" description="PackagingMeanPart presence">
          {charts?.partLinkDonut.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={charts.partLinkDonut} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                  {charts.partLinkDonut.map((entry, index) => (
                    <Cell key={entry.label} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label={isLoading ? "Loading..." : "No data"} />
          )}
        </ChartCard>
      </div>

      <section className="rounded-[var(--smc-radius-lg)] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-smc-textMuted">Compatibility table</p>
            <h2 className="text-lg font-semibold text-smc-text">Transport mean x Packaging</h2>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-smc-textMuted">
                <th className="px-2 py-2 text-left">Transport mean</th>
                <th className="px-2 py-2 text-left">Packaging</th>
                <th className="px-2 py-2 text-right">Max qty</th>
                <th className="px-2 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, idx) => (
                <tr key={`${row.transportMean}-${row.packagingMean}-${idx}`} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-smc-text">{row.transportMean}</td>
                  <td className="px-2 py-2 text-smc-text">{row.packagingMean}</td>
                  <td className="px-2 py-2 text-right text-smc-text">{formatNumber(row.maxQty)}</td>
                  <td className="px-2 py-2 text-smc-text">{row.notes ?? "—"}</td>
                </tr>
              ))}
              {!table.length && !isLoading ? (
                <tr>
                  <td className="px-2 py-4 text-sm text-smc-textMuted" colSpan={4}>
                    No links available.
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

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center rounded-md bg-slate-50 text-sm text-smc-textMuted">{label}</div>;
}

function formatNumber(value: number | string | undefined) {
  if (value === undefined) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US").format(num);
}
