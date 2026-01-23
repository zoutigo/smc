import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { Gallery } from "@/components/media/Gallery";
import { CustomButton } from "@/components/ui/custom-button";
import { getTransportMeanById } from "../../actions";
import NotesSection from "./NotesSection";
import type { TransportMean } from "@prisma/client";

type Params = { slug: string; id: string } | Promise<{ slug: string; id: string }>;

const isPromise = <T,>(value: unknown): value is Promise<T> =>
  typeof value === "object" && value !== null && "then" in value && typeof (value as { then?: unknown }).then === "function";

const resolveParams = async (params: Params) => {
  if (isPromise<{ slug: string; id: string }>(params)) {
    return await params;
  }
  return params as { slug: string; id: string };
};

type TransportMeanWithRelations = TransportMean & {
  transportMeanCategory?: { name: string };
  supplier?: { name: string };
  plant?: { name: string };
  flow?: { slug: string };
  flows?: Array<{ flowId: string; flow?: { slug: string } }>;
  packagingLinks?: Array<{ packagingMeanId: string; maxQty: number; packagingMean?: { name: string } }>;
  images?: Array<{ imageId: string; image?: { imageUrl: string } }>;
};

export default async function TransportMeanDetailPage({ params }: { params: Params }) {
  const { slug, id } = await resolveParams(params);
  const transport = (await getTransportMeanById(id)) as TransportMeanWithRelations | null;
  if (!transport) notFound();

  const prisma = getPrisma();
  const notes = "noteLink" in prisma
    ? await prisma.noteLink.findMany({
        where: { targetType: "TRANSPORT_MEAN", targetId: id },
        include: { note: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const galleryImages = transport.images?.map((img) => ({ id: img.imageId, url: img.image?.imageUrl ?? "" })) ?? [];

  return (
    <main className="px-8 pt-6 pb-10">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-3 rounded-2xl border border-smc-border bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-smc-text-muted">{transport.transportMeanCategory?.name}</p>
              <h1 className="text-3xl font-semibold text-smc-text">{transport.name}</h1>
              <p className="text-sm text-smc-text-muted">{transport.description ?? "No description."}</p>
            </div>
            <div className="flex items-center gap-2">
              <CustomButton href={`/transport-means/${slug}`} text="Back" variant="destructive" size="sm" />
              <CustomButton href={`/transport-means/${slug}/${id}/edit`} text="Edit" size="sm" />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-smc-border/70 bg-smc-bg/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Plant</p>
              <p className="font-semibold text-smc-text">{transport.plant?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Units</p>
              <p className="font-semibold text-smc-text">{transport.units}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Load capacity (kg)</p>
              <p className="font-semibold text-smc-text">{transport.loadCapacityKg}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Cruise speed (km/h)</p>
              <p className="font-semibold text-smc-text">{transport.cruiseSpeedKmh}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Max speed (km/h)</p>
              <p className="font-semibold text-smc-text">{transport.maxSpeedKmh}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-smc-text-muted">Supplier</p>
              <p className="font-semibold text-smc-text">{transport.supplier?.name ?? "—"}</p>
            </div>
            <div className="col-span-full grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-smc-text-muted">SOP</p>
                <p className="font-semibold text-smc-text">{transport.sop?.toISOString?.().slice(0, 10) ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-smc-text-muted">EOP</p>
                <p className="font-semibold text-smc-text">{transport.eop?.toISOString?.().slice(0, 10) ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-smc-text-muted">Updated</p>
                <p className="font-semibold text-smc-text">{transport.updatedAt?.toISOString?.().slice(0, 10) ?? "—"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Flows</h3>
              <span className="text-xs text-smc-text-muted">{transport.flows?.length ?? 0} item(s)</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {transport.flows?.length
                ? transport.flows
                    .map((flow) => flow.flow?.slug)
                    .filter(Boolean)
                    .map((label) => (
                      <span key={label} className="rounded-full border border-smc-border/70 px-3 py-1 text-xs text-smc-text">
                        {label}
                      </span>
                    ))
                : <span className="text-sm text-smc-text-muted">No flows linked.</span>}
            </div>
          </div>

          <NotesSection
            slug={slug}
            transportMeanId={transport.id}
            initialNotes={notes.map((n) => ({
              id: n.noteId,
              title: n.note.title,
              content: n.note.content,
              createdAt: n.note.createdAt.toISOString(),
            }))}
          />

          <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smc-text">Packaging means</h3>
              <span className="text-xs text-smc-text-muted">
                {transport.packagingLinks?.length ?? 0} item(s)
              </span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm text-smc-text">
                <thead>
                  <tr className="text-xs uppercase text-smc-text-muted">
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Max qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(transport.packagingLinks ?? []).map((link) => (
                    <tr key={link.packagingMeanId} className="border-t border-smc-border/40">
                      <td className="px-2 py-1">{link.packagingMean?.name ?? "—"}</td>
                      <td className="px-2 py-1">{link.maxQty ?? "—"}</td>
                    </tr>
                  ))}
                  {(transport.packagingLinks ?? []).length === 0 ? (
                    <tr>
                      <td className="px-2 py-2 text-smc-text-muted" colSpan={2}>
                        No packaging means linked.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-smc-border bg-white p-4 shadow-soft">
          <Gallery images={galleryImages} title={transport.name} />
        </aside>
      </div>
    </main>
  );
}
