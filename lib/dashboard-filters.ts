import { getPrisma } from "@/lib/prisma";

const TTL_MS = 1000 * 60 * 5;

type Option = { value: string; label: string };

let packagingCache: { plants: Option[]; flows: Option[]; expiresAt: number } | null = null;
let transportCache: { plants: Option[]; categories: Option[]; expiresAt: number } | null = null;

export async function getPackagingDashboardFilters() {
  const now = Date.now();
  if (packagingCache && packagingCache.expiresAt > now) return packagingCache;

  const prisma = getPrisma();
  const [plants, flows] = await Promise.all([
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.flow.findMany({ select: { id: true, from: true, to: true, slug: true }, orderBy: { from: "asc" } }),
  ]);

  const data = {
    plants: plants.map((p) => ({ value: p.id, label: p.name })),
    flows: flows.map((f) => ({ value: f.id, label: `${f.from.toLowerCase()} → ${f.to.toLowerCase()}` })),
    expiresAt: now + TTL_MS,
  };
  packagingCache = data;
  return data;
}

export async function getTransportDashboardFilters() {
  const now = Date.now();
  if (transportCache && transportCache.expiresAt > now) return transportCache;

  const prisma = getPrisma();
  const [plants, categories] = await Promise.all([
    prisma.plant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.transportMeanCategory.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const data = {
    plants: plants.map((p) => ({ value: p.id, label: p.name })),
    categories: categories.map((c) => ({ value: c.slug, label: c.name })),
    expiresAt: now + TTL_MS,
  };
  transportCache = data;
  return data;
}

export function clearDashboardFilterCaches() {
  packagingCache = null;
  transportCache = null;
}
