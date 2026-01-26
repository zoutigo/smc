import { notFound } from "next/navigation";

import { MetricTile } from "@/components/dashboard/metric-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrisma } from "@/lib/prisma";

const num = (v: unknown) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "object" && v !== null && "toNumber" in (v as Record<string, unknown>) && typeof (v as { toNumber: unknown }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const dynamic = "force-dynamic";

export default async function StorageMeanDashboardDetail({ params }: { params: { category: string; id: string } }) {
  const prisma = getPrisma();
  const storageMean = await prisma.storageMean.findUnique({
    where: { id: params.id },
    include: {
      plant: true,
      supplier: true,
      storageMeanCategory: true,
      flows: { include: { flow: true } },
      laneGroups: { include: { lanes: true } },
      staffingLines: true,
      highBayRack: true,
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              width: true,
              length: true,
              height: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!storageMean || storageMean.storageMeanCategory?.slug !== params.category) notFound();

  const useful = num(storageMean.usefulSurfaceM2);
  const gross = num(storageMean.grossSurfaceM2);
  const efficiency = gross > 0 ? (useful / gross) * 100 : 0;
  const totalLanes = storageMean.laneGroups.reduce(
    (acc, lg) => acc + lg.lanes.reduce((lAcc, l) => lAcc + (l.numberOfLanes ?? 0), 0),
    0,
  );
  const workforce = storageMean.staffingLines.reduce((acc, line) => acc + num(line.qty), 0);
  const hostedPackaging = storageMean.packagingLinks.map((link) => {
    const qty = link.qty ?? 0;
    const maxQty = link.maxQty ?? 0;
    const packagingPrice = link.packagingMean?.price ?? 0;
    const volumeUnitM3 =
      ((link.packagingMean?.width ?? 0) * (link.packagingMean?.length ?? 0) * (link.packagingMean?.height ?? 0)) / 1_000_000_000;
    return {
      packagingMeanId: link.packagingMeanId,
      packagingMean: link.packagingMean?.name ?? "Unknown packaging",
      category: link.packagingMean?.packagingMeanCategory?.name ?? "Uncategorized",
      qty,
      maxQty,
      occupancyPct: maxQty > 0 ? (qty / maxQty) * 100 : 0,
      value: qty * packagingPrice,
      volume: volumeUnitM3 * qty,
      notes: link.notes,
    };
  });
  const totalPackagingQty = hostedPackaging.reduce((sum, row) => sum + row.qty, 0);
  const totalPackagingMax = hostedPackaging.reduce((sum, row) => sum + row.maxQty, 0);
  const totalPackagingValue = hostedPackaging.reduce((sum, row) => sum + row.value, 0);
  const occupancyPctStorage = totalPackagingMax > 0 ? (totalPackagingQty / totalPackagingMax) * 100 : 0;
  const distinctPackaging = new Set(hostedPackaging.map((p) => p.packagingMeanId)).size;

  const metrics = [
    { label: "Useful surface", value: `${useful.toFixed(1)} m²` },
    { label: "Gross surface", value: `${gross.toFixed(1)} m²` },
    { label: "Efficiency", value: `${efficiency.toFixed(1)}%` },
    { label: "Price", value: `€${storageMean.price.toLocaleString()}` },
    { label: "Lanes", value: totalLanes.toString() },
    { label: "Workforce", value: workforce.toFixed(2) },
    { label: "Qty hébergée", value: totalPackagingQty.toLocaleString("en-US") },
    { label: "Occupation", value: `${occupancyPctStorage.toFixed(1)}%`, helper: `MaxQty ${totalPackagingMax.toLocaleString("en-US")}` },
    { label: "Valeur hébergée €", value: `€${totalPackagingValue.toLocaleString("en-US")}` },
    { label: "Packaging distincts", value: distinctPackaging.toString() },
  ];

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-smc-text-muted">Storage mean · Detail</p>
        <h1 className="text-2xl font-semibold leading-tight">{storageMean.name}</h1>
        <p className="text-sm text-smc-text-muted">{storageMean.description ?? "No description"}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <MetricTile key={m.label} label={m.label} value={m.value} helper={m.helper} />
          ))}
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Hosted packaging</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-smc-text-muted">
                <tr>
                  <th className="px-2 py-1 text-left">PackagingMean</th>
                  <th className="px-2 py-1 text-left">Category</th>
                  <th className="px-2 py-1 text-right">Qty</th>
                  <th className="px-2 py-1 text-right">MaxQty</th>
                  <th className="px-2 py-1 text-right">Occ. %</th>
                  <th className="px-2 py-1 text-right">Valeur €</th>
                  <th className="px-2 py-1 text-right">Volume occupé</th>
                  <th className="px-2 py-1 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {hostedPackaging.map((row) => (
                  <tr key={row.packagingMeanId} className="border-t border-smc-border/50">
                    <td className="px-2 py-1">{row.packagingMean}</td>
                    <td className="px-2 py-1 text-smc-text-muted">{row.category}</td>
                    <td className="px-2 py-1 text-right">{row.qty.toLocaleString("en-US")}</td>
                    <td className="px-2 py-1 text-right">{row.maxQty.toLocaleString("en-US")}</td>
                    <td className="px-2 py-1 text-right">{row.occupancyPct.toFixed(1)}%</td>
                    <td className="px-2 py-1 text-right">€{row.value.toLocaleString("en-US")}</td>
                    <td className="px-2 py-1 text-right">{row.volume.toFixed(2)} m³</td>
                    <td className="px-2 py-1 text-smc-text-muted">{row.notes ?? "—"}</td>
                  </tr>
                ))}
                {!hostedPackaging.length ? (
                  <tr>
                    <td className="px-2 py-2 text-sm text-smc-text-muted" colSpan={8}>
                      No packaging hosted.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Flows</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              {storageMean.flows.map((f) => (
                <span key={f.flowId} className="rounded-full bg-smc-border px-3 py-1 text-smc-text-muted">
                  {f.flow.slug}
                </span>
              )) || <p className="text-smc-text-muted">No flows.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Lane groups</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {storageMean.laneGroups.length === 0 && <p className="text-smc-text-muted">No lane groups.</p>}
              {storageMean.laneGroups.map((lg) => (
                <div key={lg.id} className="rounded-lg border border-smc-border/60 p-3">
                  <div className="font-semibold">{lg.name ?? "Lane group"}</div>
                  <p className="text-xs text-smc-text-muted">{lg.description ?? ""}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {lg.lanes.map((lane) => (
                      <div key={lane.id} className="rounded border border-dashed border-smc-border/70 p-2">
                        <div className="font-semibold">Level {lane.level}</div>
                        <div>
                          {lane.lengthMm}×{lane.widthMm}×{lane.heightMm} mm
                        </div>
                        <div>Qty: {lane.numberOfLanes}</div>
                        <div className="uppercase text-[10px] text-smc-text-muted">{lane.laneType}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Workforce</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {storageMean.staffingLines.length === 0 && <p className="text-smc-text-muted">No staffing lines.</p>}
              {storageMean.staffingLines.map((line) => (
                <div key={line.id} className="rounded border border-smc-border/70 p-2">
                  <div className="font-semibold">
                    {line.role} · {line.shift}
                  </div>
                  <div className="text-xs text-smc-text-muted">
                    {line.workforceType} · Qty {num(line.qty)}
                  </div>
                  {line.description ? <p className="text-xs text-smc-text-muted">{line.description}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>High bay rack spec</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {storageMean.highBayRack ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border border-smc-border/70 p-2">Levels: {storageMean.highBayRack.numberOfLevels}</div>
                  <div className="rounded border border-smc-border/70 p-2">Bays: {storageMean.highBayRack.numberOfBays}</div>
                  <div className="rounded border border-smc-border/70 p-2">
                    Slot: {storageMean.highBayRack.slotLengthMm}×{storageMean.highBayRack.slotWidthMm}×
                    {storageMean.highBayRack.slotHeightMm} mm
                  </div>
                  <div className="rounded border border-smc-border/70 p-2">Slots: {storageMean.highBayRack.numberOfSlots}</div>
                </div>
              ) : (
                <p className="text-smc-text-muted">No high bay rack spec.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
