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
              accessories: {
                include: { accessory: { include: { supplier: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!packaging) notFound();

  const galleryImages = packaging.images.map((img) => ({ id: img.imageId, url: img.image.imageUrl }));
  const notes = "noteLink" in prisma
    ? await prisma.noteLink.findMany({
        where: { targetType: "PACKAGING_MEAN", targetId: id },
        include: { note: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main className="px-8 pt-6 pb-10">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-smc-border bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-smc-text-muted">{packaging.packagingMeanCategory.name}</p>
              <h1 className="text-3xl font-semibold text-smc-text">{packaging.name}</h1>
              <p className="text-sm text-smc-text-muted">{packaging.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <CustomButton href={`/packaging-means/${slug}`} text="Back" variant="destructive" size="sm" />
              <CustomButton href={`/packaging-means/${slug}/${id}/edit`} text="Edit" size="sm" />
            </div>
          </div>
          <div className="grid gap-4 rounded-xl border border-smc-border/70 bg-smc-bg/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Dimensions (mm)</p>
              <p className="font-semibold text-smc-text">
                {packaging.length} × {packaging.width} × {packaging.height}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Total packagings</p>
              <p className="font-semibold text-smc-text">{packaging.numberOfPackagings}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Price</p>
              <p className="font-semibold text-smc-text">${packaging.price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Plant</p>
              <p className="font-semibold text-smc-text">{packaging.plant.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Flow</p>
              <p className="font-semibold text-smc-text">{packaging.flow?.slug ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Supplier</p>
              <p className="font-semibold text-smc-text">{packaging.supplier?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">SOP</p>
              <p className="font-semibold text-smc-text">{packaging.sop.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">EOP</p>
              <p className="font-semibold text-smc-text">{packaging.eop.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Parts</h3>
              <span className="text-xs text-smc-text-muted">{packaging.parts.length} item(s)</span>
            </div>
            <div className="mt-3 overflow-x-auto">
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
          </div>

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Packaging Accessories</h3>
              <span className="text-xs text-smc-text-muted">{packaging.accessories.length} item(s)</span>
            </div>
            <div className="mt-3 overflow-x-auto">
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
          </div>

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Part Accessories</h3>
              <span className="text-xs text-smc-text-muted">
                {packaging.parts.reduce((acc, p) => acc + (p.part.accessories?.length ?? 0), 0)} item(s)
              </span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm text-smc-text">
                <thead>
                  <tr className="text-xs uppercase text-smc-text-muted">
                    <th className="px-2 py-1 text-left">Part</th>
                    <th className="px-2 py-1 text-left">Accessory</th>
                    <th className="px-2 py-1 text-left">Qty/part</th>
                    <th className="px-2 py-1 text-left">Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {packaging.parts.flatMap((p) =>
                    (p.part.accessories ?? []).map((link) => (
                      <tr key={`${p.partId}-${link.accessoryId}`} className="border-t border-smc-border/40">
                        <td className="px-2 py-1">{p.part.name}</td>
                        <td className="px-2 py-1 text-smc-text">{link.accessory?.name ?? "—"}</td>
                        <td className="px-2 py-1">{link.qtyPerPart ?? 1}</td>
                        <td className="px-2 py-1 text-smc-text-muted">{link.accessory?.supplier?.name ?? "—"}</td>
                      </tr>
                    ))
                  )}
                  {packaging.parts.every((p) => (p.part.accessories ?? []).length === 0) ? (
                    <tr>
                      <td className="px-2 py-2 text-smc-text-muted" colSpan={4}>
                        No part accessories.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <NotesSection
            slug={slug}
            packagingMeanId={packaging.id}
            initialNotes={notes.map((n) => ({
              id: n.noteId,
              title: n.note.title,
              content: n.note.content,
              createdAt: n.note.createdAt.toISOString(),
            }))}
          />

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner">
            <h3 className="text-lg font-semibold text-smc-text">Meta</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-smc-text-muted">Created</p>
                <p className="font-semibold text-smc-text">{packaging.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-smc-text-muted">Updated</p>
                <p className="font-semibold text-smc-text">{packaging.updatedAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-smc-text-muted">Status</p>
                <p className="font-semibold text-smc-text">{packaging.status.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-smc-text-muted">Category</p>
                <p className="font-semibold text-smc-text">{packaging.packagingMeanCategory.name}</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-smc-border bg-white p-4 shadow-soft">
          <Gallery images={galleryImages} title={packaging.name} />
        </aside>
      </div>
    </main>
  );
}
