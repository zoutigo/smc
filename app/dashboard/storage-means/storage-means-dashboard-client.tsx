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
type SimpleRow = { name: string; value: number };
type DonutRow = { name: string; value: number; fill?: string };

type TopSurfaceRow = { name: string; plant: string; category: string; usefulSurface: number; lanes: number };
type TopWorkforceRow = { name: string; plant: string; category: string; workforce: number; lanes: number };

type Props = {
  metrics: Metric[];
  surfaceByPlant: SimpleRow[];
  efficiencyByCategory: SimpleRow[];
  meansByCategory: DonutRow[];
  workforceByPlant: SimpleRow[];
  lanesByPlant: SimpleRow[];
  topSurface: TopSurfaceRow[];
  topWorkforce: TopWorkforceRow[];
  occupancyCards: {
    totalQty: number;
    totalValue: number;
    totalMaxQty: number;
    occupancyPct: number;
    overCapacityCount: number;
    configuredPct: number;
    configuredCount: number;
    distinctPackagingCount: number;
    slotsRemaining: number;
  };
  occupancyByPlant: Array<{ name: string; occupancyPct: number; qty: number; maxQty: number; value: number }>;
  valueByPlant: SimpleRow[];
  configuredDonut: DonutRow[];
  storageTable: Array<{
    id: string;
    name: string;
    plant: string;
    category: string;
    qty: number;
    maxQty: number;
    occupancyPct: number;
    value: number;
    slotsRemaining: number;
    distinctPackaging: number;
  }>;
  heroTitle?: string;
  heroSubtitle?: string;
  heroEyebrow?: string;
  showHero?: boolean;
};

const barPalette = ["#0e355d", "#0f7c8c", "#f8a370", "#c4ac5e", "#6c7a89", "#e86f68"];

export function StorageMeansDashboardClient({
  metrics,
  surfaceByPlant,
  efficiencyByCategory,
  meansByCategory,
  workforceByPlant,
  lanesByPlant,
  topSurface,
  topWorkforce,
  occupancyCards,
  occupancyByPlant,
  valueByPlant,
  configuredDonut,
  storageTable,
  heroTitle,
  heroSubtitle,
  heroEyebrow,
  showHero = true,
}: Props) {
  const colorize = (rows: SimpleRow[], offset = 0) =>
    rows.map((row, idx) => ({ ...row, fill: barPalette[(idx + offset) % barPalette.length] }));

  const donutColors = meansByCategory.map((row, idx) => ({
    ...row,
    fill: barPalette[idx % barPalette.length],
  }));
  const occupancyColors = occupancyByPlant.map((row, idx) => ({ ...row, fill: barPalette[(idx + 1) % barPalette.length] }));
  const valueByPlantColored = valueByPlant.map((row, idx) => ({ ...row, fill: barPalette[(idx + 2) % barPalette.length] }));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {showHero ? (
        <section className="rounded-2xl bg-gradient-to-r from-[#0e355d] via-[#0f7c8c] to-[#f8a370] px-6 py-4 text-white shadow-[0_14px_30px_rgba(12,24,56,0.2)]">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">{heroEyebrow ?? "Storage means dashboard"}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold leading-tight">{heroTitle ?? "Global storage overview"}</h1>
                <p className="text-sm text-white/80">{heroSubtitle ?? "Surface, lanes, workforce, and value at a glance."}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
                Live data
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <MetricTile key={m.label} label={m.label} value={m.value} helper={m.helper} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Useful surface (m²) by plant" description="Σ(usefulSurfaceM2)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colorize(surfaceByPlant)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {colorize(surfaceByPlant).map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Efficiency (%) by category" description="useful / gross">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colorize(efficiencyByCategory, 2)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {colorize(efficiencyByCategory, 2).map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Qty packaging stockée" value={occupancyCards.totalQty.toLocaleString("en-US")} />
        <MetricTile label="Valeur hébergée (€)" value={occupancyCards.totalValue.toLocaleString("en-US")} helper="Σ(qty × price)" />
        <MetricTile
          label="Taux d’occupation"
          value={`${occupancyCards.occupancyPct.toFixed(1)}%`}
          helper={`MaxQty ${occupancyCards.totalMaxQty.toLocaleString("en-US")}`}
        />
        <MetricTile
          label="Storage surchargés"
          value={occupancyCards.overCapacityCount.toString()}
          helper={`${occupancyCards.configuredPct.toFixed(0)}% paramétrés`}
        />
        <MetricTile label="Slots restants" value={occupancyCards.slotsRemaining.toLocaleString("en-US")} helper="Σ(maxQty - qty)" />
        <MetricTile label="Packaging distincts" value={occupancyCards.distinctPackagingCount.toLocaleString("en-US")} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Occupation (%) par Plant" description="Σ(qty) / Σ(maxQty)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyColors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tickLine={false} />
              <Tooltip
                formatter={(value, _name, props) => {
                  if (typeof value !== "number") return "";
                  const row = props?.payload as (typeof occupancyColors)[number] | undefined;
                  return [`${value.toFixed(1)}%`, `Qty ${row?.qty?.toLocaleString("en-US") ?? 0} / Max ${row?.maxQty?.toLocaleString("en-US") ?? 0}`];
                }}
              />
              <Bar dataKey="occupancyPct" radius={[6, 6, 0, 0]}>
                {occupancyColors.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Valeur hébergée (€) par Plant" description="Σ(qty × price)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valueByPlantColored}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tickLine={false} />
              <Tooltip formatter={(value) => (typeof value === "number" ? `€${value.toLocaleString("en-US")}` : "")} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {valueByPlantColored.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Paramétrage maxQty" description="% storage means avec capacité définie">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={configuredDonut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {configuredDonut.map((entry, idx) => (
                  <Cell key={entry.name} fill={barPalette[idx % barPalette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Storage means by category" description="Count per category">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutColors} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {donutColors.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workforce (qty) by plant" description="Σ(staffing qty)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colorize(workforceByPlant, 3)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {colorize(workforceByPlant, 3).map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Total lanes by plant" description="Σ(numberOfLanes)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colorize(lanesByPlant, 1)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {colorize(lanesByPlant, 1).map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Top storage means by useful surface</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-smc-text-muted">
                <tr>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-left">Plant</th>
                  <th className="px-2 py-1 text-left">Category</th>
                  <th className="px-2 py-1 text-left">Useful m²</th>
                  <th className="px-2 py-1 text-left">Lanes</th>
                </tr>
              </thead>
              <tbody>
                {topSurface.map((row) => (
                  <tr key={row.name} className="border-t border-smc-border/50">
                    <td className="px-2 py-1">{row.name}</td>
                    <td className="px-2 py-1 text-smc-text-muted">{row.plant}</td>
                    <td className="px-2 py-1 text-smc-text-muted">{row.category}</td>
                    <td className="px-2 py-1">{row.usefulSurface.toLocaleString()}</td>
                    <td className="px-2 py-1">{row.lanes}</td>
                  </tr>
                ))}
                {topSurface.length === 0 ? (
                  <tr>
                    <td className="px-2 py-2 text-smc-text-muted" colSpan={5}>
                      No data.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Top storage means by workforce</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase text-smc-text-muted">
              <tr>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Plant</th>
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-left">Workforce</th>
                <th className="px-2 py-1 text-left">Lanes</th>
              </tr>
            </thead>
            <tbody>
              {topWorkforce.map((row) => (
                <tr key={row.name} className="border-t border-smc-border/50">
                  <td className="px-2 py-1">{row.name}</td>
                  <td className="px-2 py-1 text-smc-text-muted">{row.plant}</td>
                  <td className="px-2 py-1 text-smc-text-muted">{row.category}</td>
                  <td className="px-2 py-1">{row.workforce.toLocaleString()}</td>
                  <td className="px-2 py-1">{row.lanes}</td>
                </tr>
              ))}
              {topWorkforce.length === 0 ? (
                <tr>
                  <td className="px-2 py-2 text-smc-text-muted" colSpan={5}>
                    No data.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Top storage means (occupation & valeur)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase text-smc-text-muted">
              <tr>
                <th className="px-2 py-1 text-left">Name</th>
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
              {storageTable.map((row) => (
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
              {storageTable.length === 0 ? (
                <tr>
                  <td className="px-2 py-2 text-smc-text-muted" colSpan={9}>
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
