import Image from "next/image";
import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryControls } from "./CategoryControls";
import { CustomButton } from "@/components/ui/custom-button";
import { getPrisma } from "@/lib/prisma";
import { getPackagingMeanCategoryBySlug } from "../actions";
import { findPackagingMeanCategoryFallbackBySlug } from "../fallback-data";
import { MeanCardsGrid, type MeanCardItem } from "@/components/commonModule/MeanCardsGrid";

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
  // Avoid DB access during build/CI
  return [];
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
  const showHero = showHeroParam === "1";
  const category = await getPackagingMeanCategoryBySlug(slug);
  const resolvedCategory = category ?? findPackagingMeanCategoryFallbackBySlug(slug);
  if (!resolvedCategory) {
    notFound();
  }

  const prisma = getPrisma();
  let plants: { id: string; name: string }[] = [];
  let flows: { id: string; slug: string }[] = [];
  let packagingMeans: Prisma.PackagingMeanGetPayload<{
    include: { plant: true; flow: true; parts: true };
  }>[] = [];

  try {
    [plants, flows, packagingMeans] = await Promise.all([
      prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.flow.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
      prisma.packagingMean.findMany({
        where: {
          packagingMeanCategory: { slug },
          ...(plantId ? { plantId } : {}),
          ...(flowId ? { flowId } : {}),
        },
        orderBy: { updatedAt: "desc" },
        include: { plant: true, flow: true, parts: true },
      }),
    ]);
  } catch (err) {
    console.error("[packaging-means/[slug]] failed to load from DB, rendering fallback", err);
    plants = [];
    flows = [];
    packagingMeans = [];
  }

  const fallbackText = resolvedCategory.name.slice(0, 2).toUpperCase();

  const meanItems: MeanCardItem[] = packagingMeans.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    label: "PACKAGING",
    dimensionsLabel: `${pkg.width}x${pkg.length}x${pkg.height} mm`,
    plantName: pkg.plant?.name ?? "—",
    flowSlug: pkg.flow?.slug ?? "—",
    priceLabel: pkg.price ? `$${pkg.price.toLocaleString()}` : undefined,
    statusLabel: pkg.status.toLowerCase(),
    unitsLabel: pkg.numberOfPackagings?.toString(),
    variantsLabel: pkg.parts?.length?.toString(),
    updatedAt: pkg.updatedAt.toLocaleDateString(),
    sop: pkg.sop.toLocaleDateString(),
    eop: pkg.eop.toLocaleDateString(),
    viewHref: `/packaging-means/${slug}/${pkg.id}`,
    editHref: `/packaging-means/${slug}/${pkg.id}/edit`,
  }));

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

      <section className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-smc-text">{`${resolvedCategory.name}'s list`}</h2>
            <p className="text-sm text-smc-text-muted">Browse all {resolvedCategory.name.toLowerCase()} below.</p>
          </div>
          <CustomButton
            href={`/packaging-means/${resolvedCategory.slug}/new`}
            text={`Create ${resolvedCategory.name}`}
          />
        </div>
        <MeanCardsGrid items={meanItems} emptyMessage="No packaging means yet in this category." />
      </section>
    </main>
  );
}
