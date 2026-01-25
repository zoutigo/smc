import { notFound } from "next/navigation";

import { storageMeanRegistry, resolveStorageMeanSlug } from "../../_registry/storageMean.registry";
import { getPrisma } from "@/lib/prisma";
import { ConfirmProvider } from "@/components/ui/confirm-message";

type Params = { slug: string } | Promise<{ slug: string }>;

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

export default async function NewStorageMeanPage({ params }: { params: Params }) {
  const { slug } = await resolveParams(params);
  const prisma = getPrisma();
  const category = await prisma.storageMeanCategory.findUnique({ where: { slug } });
  if (!category) return notFound();

  const resolvedSlug = resolveStorageMeanSlug(category.slug);
  if (!resolvedSlug) return notFound();

  const entry = storageMeanRegistry[resolvedSlug];
  if (!entry) return notFound();

  const Form = entry.Form;
  const plants = await prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const flows = await prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true }, orderBy: { slug: "asc" } });
  const countries = await prisma.country.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <ConfirmProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create {category.name}</h1>
        </div>
        <Form
          mode="create"
          categoryId={category.id}
          categorySlug={category.slug}
          specType={entry.specType}
          plants={plants}
          flows={flows}
          suppliers={suppliers}
          countries={countries}
        />
      </div>
    </ConfirmProvider>
  );
}
