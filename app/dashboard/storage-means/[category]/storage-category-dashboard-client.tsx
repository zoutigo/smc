"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StorageDashboardData } from "@/lib/storage-dashboard-data";
import { StorageMeansDashboardClient } from "../storage-means-dashboard-client";

const tabs = [
  { slug: "overview", label: "Overview" },
  { slug: "lanes", label: "Lanes" },
  { slug: "occupancy", label: "Occupancy" },
] as const;

type TabSlug = (typeof tabs)[number]["slug"];

type Props = {
  category: { id: string; name: string; slug: string; description: string | null };
  data: StorageDashboardData;
};

export function StorageCategoryDashboardClient({ category, data }: Props) {
  const pathname = usePathname();
  const currentTab = (pathname?.split("/").at(-1) ?? "overview") as TabSlug;
  const resolvedTab: TabSlug = tabs.find((t) => pathname.endsWith(t.slug)) ? currentTab : "overview";

  const contentByTab: Record<TabSlug, JSX.Element> = {
    overview: (
      <StorageMeansDashboardClient
        {...data}
        showHero={false}
        heroEyebrow="Storage means · Category"
        heroTitle={category.name}
        heroSubtitle={category.description ?? "Overview and capacity for this category."}
      />
    ),
    lanes: <LanesTab data={data} />,
    occupancy: <OccupancyTab data={data} />,
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
        <div>
          <p className="text-sm text-smc-textMuted">Storage category dashboard</p>
          <h1 className="text-2xl font-semibold text-smc-primary">{category.name}</h1>
          {category.description ? <p className="text-sm text-smc-textMuted">{category.description}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const href = tab.slug === "overview" ? `/dashboard/storage-means/${category.slug}` : `/dashboard/storage-means/${category.slug}/${tab.slug}`;
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

      {contentByTab[resolvedTab]}
    </div>
  );
}

function LanesTab({ data }: { data: StorageDashboardData }) {
  const totalLanes = data.lanesByPlant.reduce((sum, row) => sum + row.value, 0);
  const saturation = totalLanes > 0 ? data.occupancyCards.totalQty / totalLanes : 0;
  const lanesVsQty = data.lanesByPlant.map((lane) => ({
    name: lane.name,
    lanes: lane.value,
    qty: data.occupancyByPlant.find((p) => p.name === lane.name)?.qty ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Qty totale stockée" value={data.occupancyCards.totalQty.toLocaleString("en-US")} />
        <MetricTile label="Slots restants" value={data.occupancyCards.slotsRemaining.toLocaleString("en-US")} helper="Σ(maxQty - qty)" />
        <MetricTile label="MaxQty totale" value={data.occupancyCards.totalMaxQty.toLocaleString("en-US")} />
        <MetricTile label="Lanes saturation" value={saturation.toFixed(2)} helper="qty / lanes" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Qty vs lanes par plant" description="Comparaison capacité / lanes">
          <ResponsiveContainer>
            <BarChart data={lanesVsQty}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="lanes" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="qty" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lanes par plant" description="Σ(numberOfLanes)">
          <ResponsiveContainer>
            <BarChart data={data.lanesByPlant}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="rgba(20,36,64,0.8)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function OccupancyTab({ data }: { data: StorageDashboardData }) {
  const detail = data.storageOccupancyDetail ?? [];
  const sorted = detail.slice().sort((a, b) => b.occupancyPct - a.occupancyPct);
  const occupancyBars = [...sorted.slice(0, 10), ...sorted.slice(-10)];
  const valueBars = detail.slice().sort((a, b) => b.value - a.value).slice(0, 15);
  const topPackaging = data.topStoredPackaging ?? [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricTile label="Qty totale" value={data.occupancyCards.totalQty.toLocaleString("en-US")} />
        <MetricTile
          label="MaxQty totale"
          value={data.occupancyCards.totalMaxQty.toLocaleString("en-US")}
          helper={`Coverage ${data.occupancyCards.occupancyPct.toFixed(1)}%`}
        />
        <MetricTile label="Occupation" value={`${data.occupancyCards.occupancyPct.toFixed(1)}%`} />
        <MetricTile label="Over capacity" value={data.occupancyCards.overCapacityCount.toString()} />
        <MetricTile label="Slots restants" value={data.occupancyCards.slotsRemaining.toLocaleString("en-US")} />
        <MetricTile label="Packaging distincts" value={data.occupancyCards.distinctPackagingCount.toLocaleString("en-US")} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Occupation (%) par storage mean" description="Top 10 + worst 10">
          <ResponsiveContainer>
            <BarChart data={occupancyBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip formatter={(value) => (typeof value === "number" ? `${value.toFixed(1)}%` : "")} />
              <Bar dataKey="occupancyPct" fill="rgb(var(--smc-primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Slots restants par storage mean">
          <ResponsiveContainer>
            <BarChart data={occupancyBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="slotsRemaining" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Valeur hébergée (€) par storage mean">
          <ResponsiveContainer>
            <BarChart data={valueBars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(value) => (typeof value === "number" ? `€${value.toLocaleString("en-US")}` : "")} />
              <Bar dataKey="value" fill="rgba(20,36,64,0.8)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Top packaging stockés (qty)" description="Top 10">
        <ResponsiveContainer>
          <BarChart data={topPackaging}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="qty" fill="rgb(var(--smc-secondary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Occupancy detail</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase text-smc-text-muted">
              <tr>
                <th className="px-2 py-1 text-left">Storage mean</th>
                <th className="px-2 py-1 text-left">Plant</th>
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-right">Qty</th>
                <th className="px-2 py-1 text-right">MaxQty</th>
                <th className="px-2 py-1 text-right">Occ. %</th>
                <th className="px-2 py-1 text-right">Value €</th>
                <th className="px-2 py-1 text-right">Slots left</th>
                <th className="px-2 py-1 text-right">#Packaging</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((row) => (
                <tr key={row.id} className="border-t border-smc-border/50">
                  <td className="px-2 py-1">{row.name}</td>
                  <td className="px-2 py-1 text-smc-text-muted">{row.plant}</td>
                  <td className="px-2 py-1 text-smc-text-muted">{row.category}</td>
                  <td className="px-2 py-1 text-right">{row.qty.toLocaleString("en-US")}</td>
                  <td className="px-2 py-1 text-right">{row.maxQty.toLocaleString("en-US")}</td>
                  <td className="px-2 py-1 text-right">{row.occupancyPct.toFixed(1)}%</td>
                  <td className="px-2 py-1 text-right">€{row.value.toLocaleString("en-US")}</td>
                  <td className="px-2 py-1 text-right">{row.slotsRemaining.toLocaleString("en-US")}</td>
                  <td className="px-2 py-1 text-right">{row.distinctPackaging}</td>
                </tr>
              ))}
              {!detail.length ? (
                <tr>
                  <td className="px-2 py-2 text-sm text-smc-text-muted" colSpan={9}>
                    No data.
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
