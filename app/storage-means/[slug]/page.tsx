import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  const fallbackText = resolvedCategory.name.slice(0, 2).toUpperCase();

  return (
    <main className="space-y-6 px-8 py-10">
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

      <section className="relative overflow-hidden rounded-[30px] border border-smc-border/70 bg-gradient-to-r from-white via-smc-bg/70 to-white p-8 shadow-card lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(248,228,182,0.14),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(14,53,113,0.12),transparent_34%)]" aria-hidden />
        <div className="relative space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-smc-primary/80">Storage mean category</p>
            <h1 className="heading-1 leading-[1.05] text-smc-text">{resolvedCategory.name}</h1>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-smc-text ring-1 ring-smc-border/70">
              Slug <span className="text-smc-primary">{resolvedCategory.slug}</span>
            </p>
          </div>
          <p className="body-text max-w-3xl text-smc-text/90">{resolvedCategory.description}</p>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-dashed border-smc-border/80 bg-white/70 p-5 text-sm text-smc-text shadow-soft">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-smc-text-muted">Created</p>
              <p className="text-base font-semibold text-smc-text">{resolvedCategory.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-smc-text-muted">Last updated</p>
              <p className="text-base font-semibold text-smc-text">{resolvedCategory.updatedAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-8 flex flex-col items-center justify-center rounded-3xl border border-smc-border/80 bg-gradient-to-br from-smc-primary/6 via-white to-smc-primary/10 p-4 shadow-card lg:mt-0">
          {resolvedCategory.image?.imageUrl ? (
            <Image
              src={resolvedCategory.image.imageUrl}
              alt={`${resolvedCategory.name} image`}
              width={540}
              height={360}
              className="h-[320px] w-full rounded-2xl object-cover shadow-[0_20px_50px_rgba(10,26,51,0.25)]"
              priority
            />
          ) : (
            <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-smc-border bg-white text-5xl font-semibold uppercase tracking-wide text-smc-primary shadow-soft">
              {fallbackText}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/60 backdrop-blur-[2px]" aria-hidden />
        </div>
      </section>
    </main>
  );
}
