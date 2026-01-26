import { notFound } from "next/navigation";
import { ConfirmProvider } from "@/components/ui/confirm-message";
import { getPrisma } from "@/lib/prisma";
import { resolveStorageMeanSlug, storageMeanRegistry, type StorageMeanCategorySlug } from "@/app/storage-means/_registry/storageMean.registry";

type Params = { slug: string; id: string } | Promise<{ slug: string; id: string }>;

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

export default async function Edit({ params }: { params: Params }) {
  const { slug, id } = await resolveParams(params);
  const prisma = getPrisma();
  const category = await prisma.storageMeanCategory.findUnique({
    where: { slug },
  });
  if (!category) return notFound();

  const resolvedSlug = resolveStorageMeanSlug(category.slug) as StorageMeanCategorySlug | undefined;
  if (!resolvedSlug) return notFound();
  const entry = storageMeanRegistry[resolvedSlug];

  const [sm, plants, flows, suppliers, countries] = await Promise.all([
    prisma.storageMean.findFirst({
      where: { id, storageMeanCategoryId: category.id },
      include: entry.include,
    }),
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true }, orderBy: { slug: "asc" } }),
    prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.country.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!sm) return notFound();

  const serializedSm = JSON.parse(
    JSON.stringify(sm, (_key, value) => {
      if (value && typeof value === "object" && "toNumber" in (value as Record<string, unknown>) && typeof (value as { toNumber: unknown }).toNumber === "function") {
        return (value as { toNumber: () => number }).toNumber();
      }
      return value;
    })
  );

  const Form = entry.Form;
  return (
    <ConfirmProvider>
      <Form
        mode="edit"
        categoryId={category.id}
        categorySlug={category.slug}
        specType={entry.specType}
        storageMean={serializedSm}
        plants={plants}
        flows={flows}
        suppliers={suppliers}
        countries={countries}
      />
    </ConfirmProvider>
  );
}
