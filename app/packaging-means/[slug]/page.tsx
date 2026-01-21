import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryControls } from "./CategoryControls";
import { CustomButton } from "@/components/ui/custom-button";
import { getPrisma } from "@/lib/prisma";
import { getPackagingMeanCategories, getPackagingMeanCategoryBySlug } from "../actions";
import { findPackagingMeanCategoryFallbackBySlug } from "../fallback-data";

export const dynamic = "force-dynamic";

type Params = { slug: string } | Promise<{ slug: string }>;
type SearchParams = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;

type PackagingMeanCategoryPageProps = {
  params: Params;
  searchParams?: SearchParams;
};

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));
const resolveSearchParams = async (searchParams?: SearchParams) =>
  searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams ?? {});

export async function generateStaticParams() {
  const categories = await getPackagingMeanCategories();
  const slugs = new Set<string>();

  categories
    .filter((category) => Boolean(category.slug))
    .forEach((category) => slugs.add(category.slug));

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PackagingMeanCategoryPageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const category = await getPackagingMeanCategoryBySlug(slug);
  const resolvedCategory = category ?? findPackagingMeanCategoryFallbackBySlug(slug);
  if (!resolvedCategory) {
    return { title: "Packaging category" };
  }
  return {
    title: `${resolvedCategory.name} | Packaging means`,
    description: resolvedCategory.description,
  };
}

export default async function PackagingMeanCategoryPage({ params, searchParams }: PackagingMeanCategoryPageProps) {
  const { slug } = await resolveParams(params);
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const plantId = typeof resolvedSearchParams?.plantId === "string" ? resolvedSearchParams?.plantId : "";
  const flowId = typeof resolvedSearchParams?.flowId === "string" ? resolvedSearchParams?.flowId : "";
  const showHeroParam = typeof resolvedSearchParams?.showHero === "string" ? resolvedSearchParams?.showHero : undefined;
  const showHero = showHeroParam !== "0";
  const category = await getPackagingMeanCategoryBySlug(slug);
  const resolvedCategory = category ?? findPackagingMeanCategoryFallbackBySlug(slug);
  if (!resolvedCategory) {
    notFound();
  }

  const prisma = getPrisma();
  const [plants, flows] = await Promise.all([
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  const packagingMeans = await prisma.packagingMean.findMany({
    where: {
      packagingMeanCategory: { slug },
      ...(plantId ? { plantId } : {}),
      ...(flowId ? { flowId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { plant: true, flow: true },
  });

  const fallbackText = resolvedCategory.name.slice(0, 2).toUpperCase();

  return (
    <main className="px-8 pt-0 pb-4 space-y-2">
      <CategoryControls showHero={showHero} plantId={plantId} flowId={flowId} plants={plants} flows={flows} />

      {showHero ? (
      <section className="grid gap-6 rounded-3xl border border-smc-border bg-white p-8 shadow-soft lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-smc-primary">{resolvedCategory.name}</h1>
              <p className="text-base text-slate-600">{resolvedCategory.description}</p>
            </div>
            <div className="rounded-full border border-smc-border/80 px-4 py-2 text-sm text-smc-text-muted">
              {packagingMeans.length} item{packagingMeans.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Slug</p>
              <p className="font-mono text-xs text-slate-600">{resolvedCategory.slug}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Dates</p>
              <p>
                <span className="text-slate-600">Created:</span> {resolvedCategory.createdAt.toLocaleDateString()}
              </p>
              <p>
                <span className="text-slate-600">Updated:</span> {resolvedCategory.updatedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-smc-primary/10 via-white to-smc-primary/5 p-6 shadow-inner">
          {resolvedCategory.image?.imageUrl ? (
            <Image
              src={resolvedCategory.image.imageUrl}
              alt={`${resolvedCategory.name} image`}
              width={360}
              height={260}
              className="h-64 w-full max-w-md rounded-2xl object-cover shadow-lg"
              priority
            />
          ) : (
            <div className="flex h-64 w-full max-w-md items-center justify-center rounded-2xl border border-smc-border bg-white text-4xl font-semibold text-smc-primary">
              {fallbackText}
            </div>
          )}
        </div>
      </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-smc-text">Packaging means in this category</h2>
            <p className="text-sm text-smc-text-muted">Browse all {resolvedCategory.name.toLowerCase()} below.</p>
          </div>
          <CustomButton
            href={`/packaging-means/${resolvedCategory.slug}/new`}
            text={`Create ${resolvedCategory.name}`}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packagingMeans.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl border border-smc-border/70 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-smc-text">{pkg.name}</h3>
                  <p className="text-xs uppercase text-smc-text-muted">
                    Updated {pkg.updatedAt.toLocaleDateString()} • SOP {pkg.sop.toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/packaging-means/${slug}/${pkg.id}`} className="text-sm font-semibold text-smc-primary hover:underline">
                  View
                </Link>
              </div>
              <p className="mt-2 text-sm text-smc-text-muted line-clamp-2">{pkg.description ?? "No description provided."}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-smc-text">
                <div>
                  <p className="font-semibold text-smc-text-muted">Plant</p>
                  <p>{pkg.plant?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-smc-text-muted">Flow</p>
                  <p>{pkg.flow?.slug ?? "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-smc-text-muted">Price</p>
                  <p>{pkg.price ? `$${pkg.price.toLocaleString()}` : "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-smc-text-muted">Status</p>
                  <p className="capitalize">{pkg.status.toLowerCase()}</p>
                </div>
              </div>
            </article>
          ))}
          {packagingMeans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-smc-border/70 bg-smc-bg/60 p-6 text-sm text-smc-text-muted">
              No packaging means yet in this category.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
