import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { getTransportMeanById } from "../../../actions";
import { updateTransportMeanAction } from "../../actions";
import { TransportMeanForm } from "../../../_registry/transport-mean.form";
import { resolveTransportMeanSlug } from "../../../_registry/transportMean.registry";
import { getCountries } from "@/lib/data";
import type { TransportMean } from "@prisma/client";
import { ConfirmProvider } from "@/components/ui/confirm-message";

type Params = { slug: string; id: string } | Promise<{ slug: string; id: string }>;

const isPromise = <T,>(value: unknown): value is Promise<T> =>
  typeof value === "object" && value !== null && "then" in value && typeof (value as { then?: unknown }).then === "function";

const resolveParams = async (params: Params) => {
  if (isPromise<{ slug: string; id: string }>(params)) return await params;
  return params as { slug: string; id: string };
};

export const dynamic = "force-dynamic";

type TransportMeanWithRelations = TransportMean & {
  packagingLinks?: Array<{ packagingMeanId: string; maxQty: number }>;
  flows?: Array<{ flowId: string }>;
};

export default async function EditTransportMeanPage({ params }: { params: Params }) {
  const { slug, id } = await resolveParams(params);
  const resolved = resolveTransportMeanSlug(slug);
  if (!resolved) notFound();
  const transport = (await getTransportMeanById(id)) as (TransportMeanWithRelations & { transportMeanCategory?: { name: string } }) | null;
  if (!transport) notFound();

  const prisma = getPrisma();
  const [suppliers, packagingMeans, plants, flows, countries] = await Promise.all([
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.packagingMean.findMany({ select: { id: true, name: true, plantId: true } }),
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true }, orderBy: { createdAt: "desc" } }),
    getCountries(),
  ]);

  const updateAction = updateTransportMeanAction.bind(null, { status: "idle" }, id);

  return (
    <ConfirmProvider>
      <TransportMeanForm
        mode="edit"
        categoryId={transport.transportMeanCategoryId}
        categoryName={transport.transportMeanCategory?.name ?? "Transport mean"}
        suppliers={suppliers}
        plants={plants}
        flows={flows}
        countries={countries}
        packagingMeans={packagingMeans}
        transport={transport}
        redirectTo={`/transport-means/${slug}`}
        onSubmit={updateAction}
      />
    </ConfirmProvider>
  );
}
