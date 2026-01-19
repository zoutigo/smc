import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { Gallery } from "@/components/media/Gallery";
import { cn } from "@/lib/utils";
import { getPrisma } from "@/lib/prisma";
import { resolveStorageMeanSlug, storageMeanRegistry, type StorageMeanCategorySlug } from "@/app/storage-means/_registry/storageMean.registry";

type Params = { slug: string; id: string } | Promise<{ slug: string; id: string }>;
type ManualStorageMean = Prisma.StorageMeanGetPayload<{ include: (typeof storageMeanRegistry)["manual-transtocker"]["include"] }>;
type AutoStorageMean = Prisma.StorageMeanGetPayload<{ include: (typeof storageMeanRegistry)["auto-transtocker"]["include"] }>;
type StorageMeanWithRelations = ManualStorageMean | AutoStorageMean;
type LaneRow = { lane: { length: number; width: number; height: number }; quantity: number };

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

const formatDate = (value?: Date | string | null) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString();
};

export default async function Detail({ params }: { params: Params }) {
  const { slug: incomingSlug, id } = await resolveParams(params);
  const prisma = getPrisma();
  const category = await prisma.storageMeanCategory.findUnique({ where: { slug: incomingSlug } });
  if (!category) return notFound();

  const resolvedSlug = resolveStorageMeanSlug(category.slug) as StorageMeanCategorySlug | undefined;
  if (!resolvedSlug) return notFound();
  const entry = storageMeanRegistry[resolvedSlug];

  const sm = (await prisma.storageMean.findFirst({
    where: { id, storageMeanCategoryId: category.id },
    include: entry.include,
  })) as StorageMeanWithRelations | null;
  if (!sm) return notFound();

  const manual = "manualTranstocker" in sm ? sm.manualTranstocker : undefined;
  const auto = "autoTranstocker" in sm ? sm.autoTranstocker : undefined;
  const lanes: LaneRow[] = manual?.lanes ?? auto?.lanes ?? [];
  const plcBrand = auto?.plcType ?? undefined;
  const galleryImages = (sm.images ?? []).map((img) => ({ id: img.imageId, url: img.image.imageUrl }));

  return (
    <main className="space-y-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <Link href={`/storage-means/${category.slug}`} className="text-sm font-semibold text-smc-primary hover:underline">
          ← Back
        </Link>
        <Link className="text-sm font-semibold text-smc-primary hover:underline" href={`/storage-means/${category.slug}/${sm.id}/edit`}>
          Edit
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-smc-border/70 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-smc-text-muted">
              <span>{category.name}</span>
              <span className="rounded-full bg-smc-border/60 px-2 py-1 text-[11px] font-semibold text-smc-text">
                {sm.status.toLowerCase()}
              </span>
            </div>
            <div className="mt-2 space-y-2">
              <h1 className="heading-2 text-smc-text">{sm.name}</h1>
              <p className="text-sm text-smc-text-muted">{sm.description || "—"}</p>
            </div>
            <div className="mt-4 rounded-xl border border-smc-border/60 bg-smc-bg/60 p-4">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <DetailItem label="Price" value={`$${sm.price?.toLocaleString?.() ?? sm.price ?? "—"}`} />
                <DetailItem label="SOP" value={formatDate(sm.sop as Date)} />
                <DetailItem label="Exists" value={sm.status?.toLowerCase() ?? "—"} />
                <DetailItem label="Plant" value={sm.plant?.name ?? "—"} />
                <DetailItem label="Flow" value={sm.flow ? `${sm.flow.from} → ${sm.flow.to}` : "—"} />
                <DetailItem label="Supplier" value={sm.supplier?.name ?? "—"} />
                {plcBrand ? <DetailItem label="PLC Brand" value={plcBrand} /> : null}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-smc-border/70 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Lanes</h3>
              <span className="text-xs font-semibold text-smc-text-muted">{lanes.length} item(s)</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-smc-border/70">
              <table className="min-w-full text-sm">
                <thead className="bg-smc-bg/80 text-xs uppercase tracking-wide text-smc-text-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Length (mm)</th>
                    <th className="px-4 py-2 text-left">Width (mm)</th>
                    <th className="px-4 py-2 text-left">Height (mm)</th>
                    <th className="px-4 py-2 text-left">Qty</th>
                    <th className="px-4 py-2 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {lanes.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-sm text-smc-text-muted" colSpan={5}>
                        No lanes defined.
                      </td>
                    </tr>
                  ) : (
                    lanes.map((lane, idx) => (
                      <tr
                        key={`${lane.lane.length}-${lane.lane.width}-${lane.lane.height}-${idx}`}
                        className={cn(idx % 2 === 0 ? "bg-white" : "bg-smc-bg/70")}
                      >
                        <td className="px-4 py-3">{lane.lane.length}</td>
                        <td className="px-4 py-3">{lane.lane.width}</td>
                        <td className="px-4 py-3">{lane.lane.height}</td>
                        <td className="px-4 py-3">{lane.quantity}</td>
                        <td className="px-4 py-3">Lane</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-smc-border/70 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-smc-text">Meta</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <MetaItem label="Created" value={formatDate(sm.createdAt as Date)} />
              <MetaItem label="Updated" value={formatDate(sm.updatedAt as Date)} />
              <MetaItem label="Category" value={category.name} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-smc-border/70 bg-white p-3 shadow-card">
          <Gallery images={galleryImages} title={sm.name} />
        </div>
      </section>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-smc-border/60 bg-white px-3 py-2 shadow-inner">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-smc-text-muted">{label}</div>
      <div className="text-sm font-semibold text-smc-text">{value}</div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-smc-border/60 bg-smc-bg/60 px-3 py-2 shadow-inner">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-smc-text-muted">{label}</div>
      <div className="text-sm font-semibold text-smc-text">{value}</div>
    </div>
  );
}
