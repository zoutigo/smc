import { notFound } from "next/navigation";

import { getPrisma } from "@/lib/prisma";
import { resolvePackagingMeanSlug } from "@/app/packaging-means/_registry/packagingMean.registry";
import { Gallery } from "@/components/media/Gallery";
import NotesSection from "./NotesSection";
import { CustomButton } from "@/components/ui/custom-button";

type Params = { slug: string; id: string } | Promise<{ slug: string; id: string }>;
const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

export default async function PackagingMeanDetailPage({ params }: { params: Params }) {
  const { slug, id } = await resolveParams(params);
  const resolved = resolvePackagingMeanSlug(slug);
  if (!resolved || !id) notFound();

  const prisma = getPrisma();
  const packaging = await prisma.packagingMean.findUnique({
    where: { id },
    include: {
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      packagingMeanCategory: true,
      plant: true,
      flow: true,
      supplier: true,
      accessories: { include: { accessory: { include: { supplier: true } } } },
      parts: {
        include: {
          part: {
            include: {
              partFamily: true,
              project: true,
              accessories: { include: { accessory: { include: { supplier: true } } } },
            },
          },
        },
      },
    },
  });
  if (!packaging) notFound();

  const galleryImages = packaging.images.map((img) => ({ id: img.imageId, url: img.image.imageUrl }));
  const noteLinks =
    "noteLink" in prisma
      ? await prisma.noteLink.findMany({
          where: { targetType: "PACKAGING_MEAN", targetId: id },
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

  const statItems = [
    { label: "Plant", value: packaging.plant.name },
    { label: "Units", value: packaging.numberOfPackagings },
    { label: "Price", value: `$${packaging.price.toLocaleString()}` },
    { label: "Flow", value: packaging.flow?.slug ?? "—" },
    { label: "Supplier", value: packaging.supplier?.name ?? "—" },
    { label: "Status", value: packaging.status.toLowerCase() },
    { label: "SOP", value: packaging.sop.toLocaleDateString() },
    { label: "EOP", value: packaging.eop.toLocaleDateString() },
    { label: "Updated", value: packaging.updatedAt.toLocaleDateString() },
  ];

  const partsTable = (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-smc-text">
        <thead>
          <tr className="text-xs uppercase text-smc-text-muted">
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Family</th>
            <th className="px-2 py-1 text-left">Project</th>
            <th className="px-2 py-1 text-left">Qty/pack</th>
            <th className="px-2 py-1 text-left">Levels</th>
            <th className="px-2 py-1 text-left">V pitch</th>
            <th className="px-2 py-1 text-left">H pitch</th>
          </tr>
        </thead>
        <tbody>
          {packaging.parts.map((p) => (
            <tr key={p.partId} className="border-t border-smc-border/40">
              <td className="px-2 py-1">{p.part.name}</td>
              <td className="px-2 py-1 text-smc-text-muted">{p.part.partFamily?.name ?? "—"}</td>
              <td className="px-2 py-1 text-smc-text-muted">{p.part.project?.name ?? "—"}</td>
              <td className="px-2 py-1">{p.partsPerPackaging ?? 1}</td>
              <td className="px-2 py-1">{p.levelsPerPackaging ?? "—"}</td>
              <td className="px-2 py-1">{p.verticalPitch ?? "—"}</td>
              <td className="px-2 py-1">{p.horizontalPitch ?? "—"}</td>
            </tr>
          ))}
          {packaging.parts.length === 0 ? (
            <tr>
              <td className="px-2 py-2 text-smc-text-muted" colSpan={7}>
                No parts.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );

  const accessoriesTable = (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-smc-text">
        <thead>
          <tr className="text-xs uppercase text-smc-text-muted">
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Supplier</th>
            <th className="px-2 py-1 text-left">Qty/pack</th>
          </tr>
        </thead>
        <tbody>
          {packaging.accessories.map((a) => (
            <tr key={a.accessoryId} className="border-t border-smc-border/40">
              <td className="px-2 py-1">{a.accessory.name}</td>
              <td className="px-2 py-1 text-smc-text-muted">{a.accessory.supplier?.name ?? "—"}</td>
              <td className="px-2 py-1">{a.qtyPerPackaging ?? 1}</td>
            </tr>
          ))}
          {packaging.accessories.length === 0 ? (
            <tr>
              <td className="px-2 py-2 text-smc-text-muted" colSpan={3}>
                No accessories.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );

  const flowTags = packaging.flow?.slug ? (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full border border-smc-border/60 bg-smc-bg/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-smc-primary">
        {packaging.flow.slug}
      </span>
    </div>
  ) : (
    <p className="text-sm text-smc-text-muted">No flow.</p>
  );

  return (
    <main className="px-6 py-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-smc-border bg-white p-5 shadow-soft space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-smc-text-muted">{packaging.packagingMeanCategory.name}</p>
              <h1 className="text-3xl font-semibold text-smc-text">{packaging.name}</h1>
              {packaging.description ? <p className="text-sm text-smc-text-muted">{packaging.description}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <CustomButton href={`/packaging-means/${slug}`} text="Back" variant="destructive" size="sm" />
              <CustomButton href={`/packaging-means/${slug}/${id}/edit`} text="Edit" size="sm" />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-smc-border/70 bg-smc-bg/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {statItems.map((stat) => (
              <div key={stat.label}>
                <p className="text-[11px] uppercase text-smc-text-muted">{stat.label}</p>
                <p className="font-semibold text-smc-text">{stat.value}</p>
              </div>
            ))}
            <div>
              <p className="text-[11px] uppercase text-smc-text-muted">Dimensions (mm)</p>
              <p className="font-semibold text-smc-text">
                {packaging.length} × {packaging.width} × {packaging.height}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Flows</h3>
              <span className="text-xs text-smc-text-muted">{flowTags ? 1 : 0} item(s)</span>
            </div>
            {flowTags}
          </div>

          <NotesSection packagingMeanId={id} slug={slug} initialNotes={initialNotes} />

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Parts</h3>
              <span className="text-xs text-smc-text-muted">{packaging.parts.length} item(s)</span>
            </div>
            {partsTable}
          </div>

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Packaging Accessories</h3>
              <span className="text-xs text-smc-text-muted">{packaging.accessories.length} item(s)</span>
            </div>
            {accessoriesTable}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-smc-border bg-white p-4 shadow-soft">
            <Gallery images={galleryImages} />
          </div>
        </aside>
      </div>
    </main>
  );
}
