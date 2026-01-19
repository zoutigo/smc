import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPrisma } from "@/lib/prisma";
import { getStorageMeanCategories, getStorageMeanCategoryBySlug } from "../actions";
import { findStorageMeanCategoryFallbackBySlug, listStorageMeanCategoryAliasSlugs } from "../fallback-data";

export const revalidate = 60;

type Params = { slug: string } | Promise<{ slug: string }>;

type StorageMeanCategoryPageProps = {
  params: Params;
};

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

export async function generateStaticParams() {
  const categories = await getStorageMeanCategories();
  const aliases = listStorageMeanCategoryAliasSlugs();

  const slugs = new Set<string>();
  categories
    .filter((category) => Boolean(category.slug))
    .forEach((category) => slugs.add(category.slug));

  aliases.forEach((alias) => slugs.add(alias));

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: StorageMeanCategoryPageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const category = await getStorageMeanCategoryBySlug(slug);
  const resolvedCategory = category ?? findStorageMeanCategoryFallbackBySlug(slug);
  if (!resolvedCategory) {
    return { title: "Storage mean category" };
  }
  return {
    title: `${resolvedCategory.name} | Storage means`,
    description: resolvedCategory.description,
  };
}

export default async function StorageMeanCategoryPage({ params }: StorageMeanCategoryPageProps) {
  const { slug } = await resolveParams(params);
  const category = await getStorageMeanCategoryBySlug(slug);
  const resolvedCategory = category ?? findStorageMeanCategoryFallbackBySlug(slug);
  if (!resolvedCategory) {
    notFound();
  }

  const prisma = getPrisma();
  const storageMeans = await prisma.storageMean.findMany({
    where: { storageMeanCategory: { slug } },
    select: {
      id: true,
      name: true,
      description: true,
      sop: true,
      plant: { select: { name: true } },
      flow: { select: { from: true, to: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const fallbackText = resolvedCategory.name.slice(0, 2).toUpperCase();

  return (
    <main className="space-y-5 px-8 py-6">
      <div className="flex items-center gap-3 text-sm text-smc-primary">
        <Link
          href="/storage-means"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "group inline-flex items-center gap-2 rounded-full border border-smc-border/60 bg-white/70 px-3 py-1 text-sm font-semibold text-smc-primary shadow-soft backdrop-blur hover:border-smc-primary/40 hover:bg-white"
          )}
        >
          <span className="transition group-hover:-translate-x-0.5">←</span>
          Back to storage means
        </Link>
        <span className="text-sm text-smc-text-muted">Category detail</span>
      </div>

      <section className="relative overflow-hidden rounded-[26px] border border-smc-border/70 bg-gradient-to-r from-white via-smc-bg/70 to-white p-6 shadow-card lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(248,228,182,0.14),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(14,53,113,0.12),transparent_34%)]" aria-hidden />
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h1 className="heading-1 leading-[1.05] text-smc-text">{resolvedCategory.name}</h1>
            <p className="text-sm text-smc-text-muted">{storageMeans.length} storage means in this category.</p>
          </div>
          <p className="body-text max-w-3xl text-smc-text/90">{resolvedCategory.description}</p>
        </div>

        <div className="relative mt-4 flex flex-col items-center justify-center rounded-3xl border border-smc-border/80 bg-gradient-to-br from-smc-primary/6 via-white to-smc-primary/10 p-3 shadow-card lg:mt-0">
          {resolvedCategory.image?.imageUrl ? (
            <Image
              src={resolvedCategory.image.imageUrl}
              alt={`${resolvedCategory.name} image`}
              width={420}
              height={240}
              className="h-[220px] w-full rounded-2xl object-cover shadow-[0_16px_36px_rgba(10,26,51,0.22)]"
              priority
            />
          ) : (
            <div className="flex h-[220px] w-full items-center justify-center rounded-2xl border border-smc-border bg-white text-4xl font-semibold uppercase tracking-wide text-smc-primary shadow-soft">
              {fallbackText}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/60 backdrop-blur-[2px]" aria-hidden />
        </div>
      </section>

      <section className="space-y-3 rounded-[24px] border border-smc-border/70 bg-white/90 p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-3 text-smc-text">Storage means in this category</h2>
            <p className="text-sm text-smc-text-muted">Browse all manual transtockers below.</p>
          </div>
          <Link
            href={`/storage-means/${slug}/new`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            {`Create ${resolvedCategory.name}`}
          </Link>
        </div>

        {storageMeans.length === 0 ? (
          <p className="text-sm text-smc-text-muted">No storage means yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {storageMeans.map((sm) => (
              <li key={sm.id} className="rounded-xl border border-smc-border/70 bg-smc-bg/40 p-4 shadow-soft space-y-2">
                <h3 className="text-base font-semibold text-smc-text">{sm.name}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-smc-text-muted">{sm.description}</p>
                <div className="text-xs text-smc-text-muted">
                  {sm.plant?.name ? <p><span className="font-semibold text-smc-text">Plant:</span> {sm.plant.name}</p> : null}
                  {sm.flow ? <p><span className="font-semibold text-smc-text">Flow:</span> {sm.flow.from} → {sm.flow.to}</p> : null}
                  <p><span className="font-semibold text-smc-text">SOP:</span> {sm.sop.toLocaleDateString?.() ?? new Date(sm.sop).toLocaleDateString()}</p>
                </div>
                <Link href={`/storage-means/${slug}/${sm.id}`} className="mt-2 inline-flex text-sm font-semibold text-smc-primary hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
