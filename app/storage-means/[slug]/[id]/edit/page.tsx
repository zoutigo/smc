import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { storageMeanRegistry, type StorageMeanCategorySlug } from "@/app/storage-means/_registry/storageMean.registry";

export default async function Edit({
  params,
}: { params: { slug: string; id: string } }) {
  const prisma = getPrisma();
  const category = await prisma.storageMeanCategory.findUnique({
    where: { slug: params.slug },
  });
  if (!category) return notFound();

  const slug = category.slug as StorageMeanCategorySlug;
  const entry = storageMeanRegistry[slug];
  if (!entry) return notFound();

  const [sm, plants, flows, suppliers, countries] = await Promise.all([
    prisma.storageMean.findFirst({
      where: { id: params.id, storageMeanCategoryId: category.id },
      include: entry.include,
    }),
    prisma.plant.findMany({ select: { id: true, name: true } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true } }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.country.findMany({ select: { id: true, name: true } }),
  ]);
  if (!sm) return notFound();

  const Form = entry.Form;
  return (
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
  );
}
