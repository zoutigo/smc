import { notFound } from "next/navigation";

import { getTransportDetailKpi } from "@/lib/kpi/transport-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Params = Promise<{ categorySlug: string; transportId: string }>;

export const metadata = {
  title: "Transport mean detail",
};

const numberFormatter = new Intl.NumberFormat("en-US");

export default async function Page({ params }: { params: Params }) {
  const { transportId } = await params;
  const kpi = await getTransportDetailKpi(transportId);
  if (!kpi) return notFound();

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--smc-radius-lg)] bg-white px-5 py-4 shadow-card">
          <div>
            <p className="text-sm text-smc-textMuted">Transport detail</p>
            <h1 className="text-2xl font-semibold text-smc-primary">{kpi.name}</h1>
            <p className="text-sm text-smc-textMuted">
              {kpi.categoryName ?? "—"} · {kpi.plantName ?? "—"} · {kpi.supplierName ?? "—"}
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Units" value={numberFormatter.format(kpi.units)} />
          <MetricCard label="Load capacity (kg)" value={numberFormatter.format(kpi.loadCapacityKg)} />
          <MetricCard label="Cruise / Max speed" value={`${kpi.cruiseSpeedKmh} / ${kpi.maxSpeedKmh} km/h`} />
          <MetricCard label="Packaging compatibles" value={numberFormatter.format(kpi.packagingCount)} />
          <MetricCard label="Flows couverts" value={numberFormatter.format(kpi.flowsCount)} />
          <MetricCard label="Flow principal" value={kpi.flowSlug ?? "—"} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Packaging compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-smc-textMuted">
                      <th className="px-2 py-2 text-left">Packaging</th>
                      <th className="px-2 py-2 text-right">Max qty</th>
                      <th className="px-2 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpi.packagingLinks.map((row, idx) => (
                      <tr key={`${row.packagingMean}-${idx}`} className="border-t border-slate-100">
                        <td className="px-2 py-2 text-smc-text">{row.packagingMean}</td>
                        <td className="px-2 py-2 text-right text-smc-text">{numberFormatter.format(row.maxQty)}</td>
                        <td className="px-2 py-2 text-smc-text">{row.notes ?? "—"}</td>
                      </tr>
                    ))}
                    {!kpi.packagingLinks.length ? (
                      <tr>
                        <td className="px-2 py-4 text-sm text-smc-textMuted" colSpan={3}>
                          No packaging linked.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Flows</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {kpi.flowSlug ? <li className="font-semibold text-smc-text">Main: {kpi.flowSlug}</li> : null}
                {kpi.flows.map((f, idx) => (
                  <li key={`${f.slug}-${idx}`} className="text-smc-textMuted">
                    {f.slug}
                  </li>
                ))}
                {!kpi.flows.length && !kpi.flowSlug ? <li className="text-smc-textMuted">No flows</li> : null}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            {kpi.images.length ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {kpi.images.map((img, idx) => (
                  <div key={`${img.url}-${idx}`} className="overflow-hidden rounded-lg border border-smc-border/60">
                    <picture>
                      <img src={img.url} alt={kpi.name} className="h-48 w-full object-cover" loading="lazy" />
                    </picture>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-smc-textMuted">No images available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <p className="text-xs uppercase text-smc-textMuted">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold text-smc-text">{value}</p>
      </CardContent>
    </Card>
  );
}
