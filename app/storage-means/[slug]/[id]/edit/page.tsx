import { notFound } from "next/navigation";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import { getPrisma } from "@/lib/prisma";
import { resolveStorageMeanSlug, storageMeanRegistry, type StorageMeanCategorySlug } from "@/app/storage-means/_registry/storageMean.registry";

export default async function Edit({
  params,
}: { params: { slug: string; id: string } }) {
  const prisma = getPrisma();
  const category = await prisma.storageMeanCategory.findUnique({
    where: { slug: params.slug },
  });
  if (!category) return notFound();

  const resolvedSlug = resolveStorageMeanSlug(category.slug) as StorageMeanCategorySlug | undefined;
  if (!resolvedSlug) return notFound();
  const entry = storageMeanRegistry[resolvedSlug];

  const [sm, plants, flows, suppliers, countries] = await Promise.all([
    prisma.storageMean.findFirst({
      where: { id: params.id, storageMeanCategoryId: category.id },
      include: entry.include,
    }),
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.country.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!sm) return notFound();

  const Form = entry.Form;
  return (
    <ConfirmProvider>
      <Form
        mode="edit"
        categoryId={category.id}
        categorySlug={category.slug}
        storageMean={sm}
        plants={plants}
        flows={flows}
        suppliers={suppliers}
        countries={countries}
      />
    </ConfirmProvider>
  );
}
