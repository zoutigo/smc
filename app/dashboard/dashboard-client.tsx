"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Metric = { label: string; value: string; helper?: string };

type TopPackagingRow = {
  name: string;
  plant: string;
  category: string;
  supplier: string;
  units: number;
  costFullUnit: number;
  totalValueFull: number;
};

type TopTransportRow = {
  name: string;
  plant: string;
  category: string;
  supplier: string;
  units: number;
  loadCapacityKg: number;
  totalCapacityKg: number;
  maxSpeedKmh: number;
};

type DashboardClientProps = {
  metrics: Metric[];
  valueByPlant: Array<{ name: string; value: number }>;
  capacityByPlant: Array<{ name: string; value: number }>;
  packagingByCategory: Array<{ name: string; value: number }>;
  volumeByCategory: Array<{ name: string; value: number }>;
  storageOccupancyByPlant: Array<{ name: string; occupancyPct: number; qty: number; maxQty: number }>;
  topPackaging: TopPackagingRow[];
  topTransport: TopTransportRow[];
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const numberFmt = new Intl.NumberFormat("en-US");

export function DashboardClient({
  metrics,
  valueByPlant,
  capacityByPlant,
  packagingByCategory,
  volumeByCategory,
  storageOccupancyByPlant,
  topPackaging,
  topTransport,
}: DashboardClientProps) {
  const barColors = ["#0e355d", "#0f7c8c", "#f8a370", "#c4ac5e", "#3a4b68"];
  const pieColors = ["#0e355d", "#0f7c8c", "#f8a370", "#c4ac5e", "#e86f68", "#6c7a89"];

  const valueByPlantData = valueByPlant.map((row, idx) => ({ ...row, fill: barColors[idx % barColors.length] }));
  const capacityByPlantData = capacityByPlant.map((row, idx) => ({ ...row, fill: barColors[(idx + 2) % barColors.length] }));
  const occupancyByPlantData = storageOccupancyByPlant.map((row, idx) => ({
    ...row,
    fill: barColors[(idx + 1) % barColors.length],
  }));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#0e355d] via-[#0f7c8c] to-[#f8a370] px-6 py-4 text-white shadow-[0_14px_30px_rgba(12,24,56,0.2)]">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Executive view</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold leading-tight">Global dashboard</h1>
              <p className="text-sm text-white/80">Plants, categories, capacity, and value in one glance.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
              Live data
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <MetricTile key={m.label} label={m.label} value={m.value} helper={m.helper} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Packaging total value (€) by plant" description="Full value = (price + accessories) × units">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valueByPlantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tickLine={false} />
              <Tooltip formatter={(value) => (typeof value === "number" ? currency.format(value) : "")} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {valueByPlantData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transport capacity (kg) by plant" description="Σ(loadCapacityKg × units)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityByPlantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tickLine={false} />
              <Tooltip formatter={(value) => (typeof value === "number" ? `${numberFmt.format(value)} kg` : "")} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {capacityByPlantData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Storage occupancy (%) by plant" description="Σ(qty) / Σ(maxQty)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyByPlantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tickLine={false} />
              <Tooltip
                formatter={(value, _name, props) => {
                  if (typeof value !== "number") return "";
                  const row = props?.payload as (typeof occupancyByPlantData)[number] | undefined;
                  return [`${value.toFixed(1)}%`, `Qty ${row?.qty?.toLocaleString("en-US") ?? 0} / Max ${row?.maxQty?.toLocaleString("en-US") ?? 0}`];
                }}
              />
              <Bar dataKey="occupancyPct" radius={[6, 6, 0, 0]}>
                {occupancyByPlantData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Packaging means by category" description="Count of packaging means">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={packagingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} label>
                {packagingByCategory.map((entry, idx) => (
                  <Cell key={entry.name} fill={pieColors[idx % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Packaging volume (m³) by category" description="Volume = (w×l×h)/1e9 × units">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(v) => `${v.toFixed(1)}m³`} tickLine={false} />
              <Tooltip formatter={(value) => (typeof value === "number" ? `${value.toFixed(2)} m³` : "")} />
              <Bar dataKey="value" fill="#0f7c8c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4">
        <TableCard title="Top packaging means by full value" columns={["Name", "Plant", "Category", "Supplier", "Units", "Unit full €", "Total €"]}>
          {topPackaging.map((row) => (
            <div
              key={row.name}
              className="grid items-center gap-2 py-2 text-sm"
              style={{ gridTemplateColumns: "1.4fr 1.2fr 1.2fr 1.2fr 0.8fr 1fr 1fr" }}
            >
              <span className="font-medium text-smc-text">{row.name}</span>
              <span className="text-smc-textMuted">{row.plant}</span>
              <span className="text-smc-textMuted">{row.category}</span>
              <span className="text-smc-textMuted">{row.supplier}</span>
              <span className="text-right text-smc-text">{numberFmt.format(row.units ?? 0)}</span>
              <span className="text-right text-smc-text">{currency.format(row.costFullUnit ?? 0)}</span>
              <span className="text-right text-smc-text font-semibold">{currency.format(row.totalValueFull ?? 0)}</span>
            </div>
          ))}
        </TableCard>

        <TableCard title="Top transport means by total capacity" columns={["Name", "Plant", "Category", "Supplier", "Units", "Load kg", "Total kg", "Max km/h"]}>
          {topTransport.map((row) => (
            <div
              key={row.name}
              className="grid items-center gap-2 py-2 text-sm"
              style={{ gridTemplateColumns: "1.4fr 1.2fr 1.2fr 1.2fr 0.8fr 0.9fr 1fr 0.8fr" }}
            >
              <span className="font-medium text-smc-text">{row.name}</span>
              <span className="text-smc-textMuted">{row.plant}</span>
              <span className="text-smc-textMuted">{row.category}</span>
              <span className="text-smc-textMuted">{row.supplier}</span>
              <span className="text-right text-smc-text">{numberFmt.format(row.units ?? 0)}</span>
              <span className="text-right text-smc-text">{numberFmt.format(row.loadCapacityKg ?? 0)}</span>
              <span className="text-right text-smc-text font-semibold">{numberFmt.format(row.totalCapacityKg ?? 0)}</span>
              <span className="text-right text-smc-text">{numberFmt.format(row.maxSpeedKmh ?? 0)}</span>
            </div>
          ))}
        </TableCard>
      </section>
    </div>
  );
}

type TableCardProps = {
  title: string;
  columns: string[];
  children: React.ReactNode;
};

function TableCard({ title, columns, children }: TableCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-smc-text">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className="grid items-center gap-2 rounded-lg bg-smc-bg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-smc-textMuted"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}
        >
          {columns.map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>
        <div className="divide-y divide-smc-border/50 rounded-lg bg-white">
          {Array.isArray(children)
            ? children.map((row, idx) => (
                <div
                  key={idx}
                  className={`px-3 ${idx % 2 === 1 ? "bg-smc-bg/60" : ""}`}
                  style={{ borderTop: idx === 0 ? "none" : undefined }}
                >
                  {row}
                </div>
              ))
            : children}
        </div>
      </CardContent>
    </Card>
  );
}
