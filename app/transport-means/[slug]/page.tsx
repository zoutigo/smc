import { notFound } from "next/navigation";
import Image from "next/image";
import { CustomButton } from "@/components/ui/custom-button";
import { getTransportMeanCategoryBySlug, getTransportMeansByCategorySlug } from "../actions";
import { getPrisma } from "@/lib/prisma";
import type { TransportMean, TransportMeanCategory } from "@prisma/client";
import { MeanCardsGrid, type MeanCardItem } from "@/components/commonModule/MeanCardsGrid";

export const dynamic = "force-dynamic";

type Params = { slug: string } | Promise<{ slug: string }>;
type SearchParams = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;

const isPromise = <T,>(value: unknown): value is Promise<T> =>
  typeof value === "object" && value !== null && "then" in value && typeof (value as { then?: unknown }).then === "function";

const resolveParams = async (params: Params) => {
  if (isPromise<{ slug: string }>(params)) {
    return await params;
  }
  return params as { slug: string };
};

const resolveSearchParams = async (searchParams?: SearchParams) => {
  if (!searchParams) return {};
  if (isPromise<Record<string, string | string[] | undefined>>(searchParams)) {
    return await searchParams;
  }
  return searchParams as Record<string, string | string[] | undefined>;
};

export async function generateStaticParams() {
  // Avoid DB access during build/CI
  return [];
}

type TransportMeanWithRelations = TransportMean & {
  plant?: { name: string };
  supplier?: { name: string };
  flow?: { slug: string };
};

type CategoryWithImage = TransportMeanCategory & { image?: { image?: { imageUrl?: string } } };

export default async function TransportMeanCategoryPage({ params, searchParams }: { params: Params; searchParams?: SearchParams }) {
  const resolvedParams = await resolveParams(params);
  const resolvedSearch = await resolveSearchParams(searchParams);

  const { slug } = resolvedParams;
  const plantId = typeof resolvedSearch?.plantId === "string" ? resolvedSearch.plantId : "";
  const flowId = typeof resolvedSearch?.flowId === "string" ? resolvedSearch.flowId : "";
  const showHeroParam = typeof resolvedSearch?.showHero === "string" ? resolvedSearch.showHero : undefined;
  const showHero = showHeroParam === "1";
  const category = (await getTransportMeanCategoryBySlug(slug)) as CategoryWithImage | null;
  if (!category) notFound();
  const prisma = getPrisma();
  const [means, plants, flows] = await Promise.all([
    getTransportMeansByCategorySlug(slug, { plantId, flowId }) as Promise<TransportMeanWithRelations[]>,
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, slug: true }, orderBy: { slug: "asc" } }),
  ]);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(resolvedSearch ?? {}).forEach(([key, value]) => {
      if (typeof value === "string") params.set(key, value);
      else if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    });
    if (updates.plantId !== undefined) {
      if (updates.plantId) params.set("plantId", updates.plantId);
      else params.delete("plantId");
    }
    if (updates.flowId !== undefined) {
      if (updates.flowId) params.set("flowId", updates.flowId);
      else params.delete("flowId");
    }
    if (updates.showHero !== undefined) {
      if (updates.showHero === "1") params.set("showHero", "1");
      else params.delete("showHero");
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const meanItems: MeanCardItem[] = means.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    label: "TRANSPORT",
    plantName: m.plant?.name ?? "—",
    flowSlug: m.flow?.slug ?? "—",
    unitsLabel: m.units?.toString(),
    statusLabel: undefined,
    variantsLabel: undefined,
    updatedAt: m.updatedAt.toLocaleDateString(),
    sop: m.sop.toLocaleDateString(),
    eop: m.eop.toLocaleDateString(),
    viewHref: `/transport-means/${slug}/${m.id}`,
    editHref: `/transport-means/${slug}/${m.id}/edit`,
  }));

  return (
    <main className="px-8 pt-0 pb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CustomButton href="/transport-means" text="Back" variant="destructive" />
        <CustomButton href={buildUrl({ showHero: showHero ? undefined : "1" }) || "#"} text={showHero ? "Close hero" : "Show hero"} variant="secondary" />
        <form className="flex flex-wrap items-center gap-2 text-sm text-smc-text" action="" method="get">
          <label htmlFor="plant-filter">Plant</label>
          <select id="plant-filter" name="plantId" defaultValue={plantId} className="rounded-md border border-smc-border/80 bg-white px-2 py-1 text-sm">
            <option value="">All</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <label htmlFor="flow-filter">Flow</label>
          <select id="flow-filter" name="flowId" defaultValue={flowId} className="rounded-md border border-smc-border/80 bg-white px-2 py-1 text-sm">
            <option value="">All</option>
            {flows.map((f) => (
              <option key={f.id} value={f.id}>
                {f.slug}
              </option>
            ))}
          </select>
          {showHero ? <input type="hidden" name="showHero" value="1" /> : null}
          <CustomButton text="Apply" type="submit" size="sm" />
        </form>
      </div>

      {showHero ? (
        <section className="grid gap-6 rounded-3xl border border-smc-border bg-white p-8 shadow-soft lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold text-smc-primary">{category.name}</h1>
                <p className="text-base text-slate-600">{category.description ?? "No description."}</p>
              </div>
              <div className="rounded-full border border-smc-border/80 px-4 py-2 text-sm text-smc-text-muted">
                {means.length} item{means.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Slug</p>
                <p className="font-mono text-xs text-slate-600">{category.slug}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Dates</p>
                <p>
                  <span className="text-slate-600">Created:</span> {category.createdAt.toLocaleDateString()}
                </p>
                <p>
                  <span className="text-slate-600">Updated:</span> {category.updatedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-smc-primary/10 via-white to-smc-primary/5 p-6 shadow-inner">
            {category.image?.image?.imageUrl ? (
              <Image
                src={category.image.image.imageUrl}
                alt={`${category.name} hero`}
                width={640}
                height={400}
                className="h-64 w-full max-w-md rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-64 w-full max-w-md items-center justify-center rounded-2xl border border-smc-border bg-white text-4xl font-semibold text-smc-primary">
                {category.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-smc-text">{`${category.name}'s list`}</h2>
            <p className="text-sm text-smc-text-muted">Browse all {category.name.toLowerCase()} below.</p>
          </div>
          <CustomButton href={`/transport-means/${slug}/new`} text={`Create ${category.name}`} />
        </div>

        <MeanCardsGrid items={meanItems} emptyMessage="No transport means in this category." />
      </section>
    </main>
  );
}
