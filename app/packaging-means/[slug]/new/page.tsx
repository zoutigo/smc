import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { getCountries } from "@/lib/data";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import { getPackagingMeanRegistryEntry, resolvePackagingMeanSlug } from "@/app/packaging-means/_registry/packagingMean.registry";
import { createPackagingMeanAction } from "../actions";

type Params = { slug: string } | Promise<{ slug: string }>;

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

export default async function NewPackagingMeanPage({ params }: { params: Params }) {
  const { slug } = await resolveParams(params);
  const resolved = resolvePackagingMeanSlug(slug);
  const registry = getPackagingMeanRegistryEntry(resolved ?? "");
  if (!registry) notFound();
  const prisma = getPrisma();
  const [category, plants, flows, suppliers, countries, accessories, projects, partFamilies] = await Promise.all([
    prisma.packagingMeanCategory.findUnique({ where: { slug } }),
    prisma.plant.findMany({ orderBy: { name: "asc" } }),
    prisma.flow.findMany({ orderBy: { slug: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    getCountries(),
    prisma.accessory.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.partFamily.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!category) notFound();

  const Form = registry.Form;
  const createAction = createPackagingMeanAction.bind(null, { status: "idle" });

  return (
    <ConfirmProvider>
      <Form
        mode="create"
        category={category}
        plants={plants}
        flows={flows}
        suppliers={suppliers}
        countries={countries}
        accessories={accessories}
        projects={projects}
        partFamilies={partFamilies}
        onSubmit={createAction}
      />
    </ConfirmProvider>
  );
}
