import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { MeanDetailLayout } from "@/components/commonModule/MeanDetailLayout";
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

  const stats = [
    { label: "Plant", value: transport.plant?.name ?? "—" },
    { label: "Units", value: transport.units },
    { label: "Load capacity (kg)", value: transport.loadCapacityKg },
    { label: "Cruise speed (km/h)", value: transport.cruiseSpeedKmh },
    { label: "Max speed (km/h)", value: transport.maxSpeedKmh },
    { label: "Supplier", value: transport.supplier?.name ?? "—" },
    { label: "SOP", value: transport.sop?.toISOString?.().slice(0, 10) ?? "—" },
    { label: "EOP", value: transport.eop?.toISOString?.().slice(0, 10) ?? "—" },
    { label: "Updated", value: transport.updatedAt?.toISOString?.().slice(0, 10) ?? "—" },
  ];

  const flowSection = (
    <>
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
    </>
  );

  const sections = [
    {
      title: "Packaging means",
      countLabel: `${transport.packagingLinks?.length ?? 0} item(s)`,
      children: (
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
      ),
    },
  ];

  const notesContent = (
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
  );

  return (
    <MeanDetailLayout
      categoryName={transport.transportMeanCategory?.name ?? ""}
      name={transport.name}
      description={transport.description ?? "No description."}
      backHref={`/transport-means/${slug}`}
      editHref={`/transport-means/${slug}/${id}/edit`}
      stats={stats}
      flowContent={flowSection}
      notesContent={notesContent}
      sections={sections}
      galleryImages={galleryImages}
    />
  );
}
