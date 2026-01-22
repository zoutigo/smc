import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { getTransportMeanCategoryBySlug } from "../../actions";
import { createTransportMeanAction } from "../actions";
import { TransportMeanForm } from "../../_registry/transport-mean.form";
import { resolveTransportMeanSlug } from "../../_registry/transportMean.registry";
import { getCountries } from "@/lib/data";
import { ConfirmProvider } from "@/components/ui/confirm-message";

type Params = { slug: string } | Promise<{ slug: string }>;

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

export const dynamic = "force-dynamic";

export default async function NewTransportMeanPage({ params }: { params: Params }) {
  const { slug } = await resolveParams(params);
  const resolved = resolveTransportMeanSlug(slug);
  if (!resolved) notFound();
  const category = await getTransportMeanCategoryBySlug(resolved);
  if (!category) notFound();

  const prisma = getPrisma();
  const [suppliers, packagingMeans, plants, flows, countries] = await Promise.all([
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.packagingMean.findMany({ select: { id: true, name: true, plantId: true } }),
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true }, orderBy: { createdAt: "desc" } }),
    getCountries(),
  ]);

  const createAction = createTransportMeanAction.bind(null, { status: "idle" });

  return (
    <ConfirmProvider>
      <TransportMeanForm
        mode="create"
        categoryId={category.id}
        categoryName={category.name}
        suppliers={suppliers}
        plants={plants}
        flows={flows}
        countries={countries}
        packagingMeans={packagingMeans}
        redirectTo={`/transport-means/${slug}`}
        onSubmit={createAction}
      />
    </ConfirmProvider>
  );
}
