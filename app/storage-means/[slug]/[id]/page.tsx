import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { storageMeanRegistry, type StorageMeanCategorySlug } from "@/app/storage-means/_registry/storageMean.registry";

export default async function Detail({
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

  const sm = await prisma.storageMean.findFirst({
    where: { id: params.id, storageMeanCategoryId: category.id },
    include: entry.include,
  });
  if (!sm) return notFound();

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Link className="underline" href={`/storage-means/${category.slug}`}>
          Back
        </Link>
        <Link className="underline" href={`/storage-means/${category.slug}/${sm.id}/edit`}>
          Edit
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{sm.name}</h1>
      <p className="opacity-70">{sm.description}</p>
    </div>
  );
}
