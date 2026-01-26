import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { MeanDetailLayout } from "@/components/commonModule/MeanDetailLayout";
import NotesSection from "./NotesSection";
import { cn } from "@/lib/utils";
import { getPrisma } from "@/lib/prisma";
import { resolveStorageMeanSlug, storageMeanRegistry, type StorageMeanCategorySlug } from "@/app/storage-means/_registry/storageMean.registry";

type Params = { slug: string; id: string } | Promise<{ slug: string; id: string }>;
type StorageMeanWithRelations = Prisma.StorageMeanGetPayload<{ include: (typeof storageMeanRegistry)["manual-transtocker"]["include"] }>;

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

const formatDate = (value?: Date | string | null) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString();
};

const formatNumber = (value: unknown) => {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "object" && "toNumber" in (value as never) ? (value as unknown as { toNumber: () => number }).toNumber() : Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString();
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

  const laneGroups = sm.laneGroups ?? [];
  const flows = sm.flows ?? [];
  const highBay = sm.highBayRack;
  const staffing = sm.staffingLines ?? [];
  const galleryImages = (sm.images ?? []).map((img) => ({ id: img.imageId, url: img.image.imageUrl }));
  const noteLinks =
    "noteLink" in prisma
      ? await prisma.noteLink.findMany({
          where: { targetType: "STORAGE_MEAN", targetId: id },
          include: { note: true },
          orderBy: { createdAt: "desc" },
        })
      : [];
  const initialNotes =
    Array.isArray(noteLinks) && noteLinks.length
      ? noteLinks.map((n) => ({
          id: n.noteId,
          title: n.note.title,
          content: n.note.content,
          createdAt: n.note.createdAt.toISOString(),
        }))
      : [];
  const flowTags =
    flows.length > 0
      ? flows
          .map((f) => f.flow?.slug)
          .filter(Boolean)
          .map((label) => (
            <span
              key={label}
              className="rounded-full border border-smc-border/70 bg-smc-bg/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-smc-primary"
            >
              {label}
            </span>
          ))
      : null;

  const stats = [
    { label: "Price", value: `$${sm.price?.toLocaleString?.() ?? sm.price ?? "—"}` },
    { label: "SOP", value: formatDate(sm.sop as Date) },
    { label: "EOP", value: formatDate(sm.eop as Date) },
    { label: "Plant", value: sm.plant?.name ?? "—" },
    { label: "Supplier", value: sm.supplier?.name ?? "—" },
    { label: "Status", value: sm.status?.toLowerCase() ?? "—" },
    { label: "Gross surface (m²)", value: formatNumber(sm.grossSurfaceM2) },
    { label: "Useful surface (m²)", value: formatNumber(sm.usefulSurfaceM2) },
    { label: "Height (mm)", value: formatNumber(sm.heightMm) },
  ];

  const flowContent = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-smc-text">Flows</h3>
        <span className="text-xs text-smc-text-muted">{flows.length} item(s)</span>
      </div>
      {flowTags ? <div className="flex flex-wrap gap-2">{flowTags}</div> : <p className="text-sm text-smc-text-muted">No flows.</p>}
    </>
  );

  const sections = [];

  sections.push({
    title: "Lane groups",
    countLabel: `${laneGroups.length} group(s)`,
    children:
      laneGroups.length === 0 ? (
        <p className="text-sm text-smc-text-muted">No lane groups.</p>
      ) : (
        <div className="space-y-4">
          {laneGroups.map((group, idx) => (
            <div key={group.id || idx} className="rounded-xl border border-smc-border/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-smc-text">{group.name || `Group ${idx + 1}`}</p>
                  {group.description ? <p className="text-sm text-smc-text-muted">{group.description}</p> : null}
                </div>
                <span className="text-xs text-smc-text-muted">{group.lanes.length} lane(s)</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-smc-border/70">
                <table className="min-w-full text-sm">
                  <thead className="bg-smc-bg/80 text-xs uppercase tracking-wide text-smc-text-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Length (mm)</th>
                      <th className="px-4 py-2 text-left">Width (mm)</th>
                      <th className="px-4 py-2 text-left">Height (mm)</th>
                      <th className="px-4 py-2 text-left">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.lanes.map((lane, laneIdx) => (
                      <tr key={`${lane.lengthMm}-${lane.widthMm}-${lane.heightMm}-${laneIdx}`} className={cn(laneIdx % 2 === 0 ? "bg-white" : "bg-smc-bg/70")}>
                        <td className="px-4 py-3">{lane.lengthMm}</td>
                        <td className="px-4 py-3">{lane.widthMm}</td>
                        <td className="px-4 py-3">{lane.heightMm}</td>
                        <td className="px-4 py-3">{lane.numberOfLanes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ),
  });

  sections.push({
    title: "Staffing",
    children:
      staffing.length === 0 ? (
        <p className="text-sm text-smc-text-muted">No staffing lines.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm text-smc-text">
          {staffing.map((s, idx) => (
            <li key={`${s.shift}-${s.workforceType}-${idx}`} className="rounded border border-smc-border px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{s.role}</span>
                <span className="text-smc-text-muted">{s.shift.replace("_", " ")} · {s.workforceType.toLowerCase()}</span>
              </div>
              <div className="text-smc-text-muted">Qty: {Number(s.qty)}</div>
              {s.description ? <div className="text-smc-text-muted">{s.description}</div> : null}
            </li>
          ))}
        </ul>
      ),
  });

  sections.push({
    title: "High-bay rack specs",
    children: highBay ? (
      <div className="mt-1 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <DetailItem label="Levels" value={String(highBay.numberOfLevels)} />
        <DetailItem label="Bays" value={String(highBay.numberOfBays)} />
        <DetailItem label="Slots" value={String(highBay.numberOfSlots)} />
        <DetailItem label="Slot length" value={`${highBay.slotLengthMm} mm`} />
        <DetailItem label="Slot width" value={`${highBay.slotWidthMm} mm`} />
        <DetailItem label="Slot height" value={`${highBay.slotHeightMm} mm`} />
      </div>
    ) : (
      <p className="text-sm text-smc-text-muted">No high-bay specifications.</p>
    ),
  });

  const packagingLinks = sm.packagingLinks ?? [];
  sections.push({
    title: "Hosted packaging",
    countLabel: `${packagingLinks.length} link(s)`,
    children:
      packagingLinks.length === 0 ? (
        <p className="text-sm text-smc-text-muted">No packaging hosted.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-smc-border/70">
          <table className="min-w-full text-sm">
            <thead className="bg-smc-bg/80 text-xs uppercase tracking-wide text-smc-text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Packaging</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">MaxQty</th>
                <th className="px-4 py-2 text-right">Occ. %</th>
                <th className="px-4 py-2 text-right">Value €</th>
                <th className="px-4 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {packagingLinks.map((link, idx) => {
                const qty = link.qty ?? 0;
                const maxQty = link.maxQty ?? 0;
                const value = (link.packagingMean?.price ?? 0) * qty;
                const occupancy = maxQty > 0 ? (qty / maxQty) * 100 : 0;
                return (
                  <tr key={link.packagingMeanId || idx} className={cn(idx % 2 === 0 ? "bg-white" : "bg-smc-bg/70")}>
                    <td className="px-4 py-2 font-semibold text-smc-text">{link.packagingMean?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-smc-text-muted">{link.packagingMean?.packagingMeanCategory?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{qty.toLocaleString("en-US")}</td>
                    <td className="px-4 py-2 text-right">{maxQty.toLocaleString("en-US")}</td>
                    <td className="px-4 py-2 text-right">{occupancy.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right">€{value.toLocaleString("en-US")}</td>
                    <td className="px-4 py-2 text-smc-text-muted">{link.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
  });

  sections.push({
    title: "Meta",
    children: (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MetaItem label="Created" value={formatDate(sm.createdAt as Date)} />
        <MetaItem label="Updated" value={formatDate(sm.updatedAt as Date)} />
        <MetaItem label="Category" value={category.name} />
      </div>
    ),
  });

  return (
    <MeanDetailLayout
      categoryName={category.name}
      name={sm.name}
      description={sm.description}
      backHref={`/storage-means/${category.slug}`}
      editHref={`/storage-means/${category.slug}/${sm.id}/edit`}
      stats={stats}
      flowContent={flowContent}
      notesContent={<NotesSection storageMeanId={sm.id} slug={category.slug} initialNotes={initialNotes} />}
      sections={sections}
      galleryImages={galleryImages}
    />
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
