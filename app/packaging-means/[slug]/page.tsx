import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPackagingCategories, getPackagingCategoryBySlug } from "../actions";
import { findPackagingCategoryFallbackBySlug } from "../fallback-data";

export const revalidate = 60;

type Params = { slug: string } | Promise<{ slug: string }>;

type PackagingCategoryPageProps = {
  params: Params;
};

const resolveParams = async (params: Params) => (params instanceof Promise ? params : Promise.resolve(params));

export async function generateStaticParams() {
  const categories = await getPackagingCategories();
  const slugs = new Set<string>();

  categories
    .filter((category) => Boolean(category.slug))
    .forEach((category) => slugs.add(category.slug));

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PackagingCategoryPageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const category = await getPackagingCategoryBySlug(slug);
  const resolvedCategory = category ?? findPackagingCategoryFallbackBySlug(slug);
  if (!resolvedCategory) {
    return { title: "Packaging category" };
  }
  return {
    title: `${resolvedCategory.name} | Packaging means`,
    description: resolvedCategory.description,
  };
}

export default async function PackagingCategoryPage({ params }: PackagingCategoryPageProps) {
  const { slug } = await resolveParams(params);
  const category = await getPackagingCategoryBySlug(slug);
  const resolvedCategory = category ?? findPackagingCategoryFallbackBySlug(slug);
  if (!resolvedCategory) {
    notFound();
  }

  const fallbackText = resolvedCategory.name.slice(0, 2).toUpperCase();

  return (
    <main className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/packaging-means"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-smc-primary/90")}
        >
          ← Back to packaging means
        </Link>
      </div>

      <section className="grid gap-8 rounded-3xl border border-smc-border bg-white p-8 shadow-soft lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-smc-primary/80">Packaging category</p>
            <h1 className="text-4xl font-bold text-slate-900">{resolvedCategory.name}</h1>
            <p className="text-base text-slate-600">
              Slug: <span className="font-mono text-sm text-slate-500">{resolvedCategory.slug}</span>
            </p>
          </div>
          <p className="text-lg leading-relaxed text-slate-700">{resolvedCategory.description}</p>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">Created:</span> {resolvedCategory.createdAt.toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Last updated:</span> {resolvedCategory.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-smc-primary/10 via-white to-smc-primary/5 p-6">
          {resolvedCategory.image?.imageUrl ? (
            <Image
              src={resolvedCategory.image.imageUrl}
              alt={`${resolvedCategory.name} image`}
              width={320}
              height={320}
              className="h-64 w-64 rounded-2xl object-cover shadow-lg"
              priority
            />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-smc-border bg-white text-4xl font-semibold text-smc-primary">
              {fallbackText}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
