import type { PackagingMeanCategory, StorageMeanCategory, TransportMeanCategory } from "@prisma/client";

import { getStorageMeanCategories } from "@/app/storage-means/actions";
import { getPackagingMeanCategories } from "@/app/packaging-means/actions";
import { getTransportMeanCategories } from "@/app/transport-means/actions";

import SidebarClient, { type SidebarClientCategory } from "./SidebarClient";

export const dynamic = "force-dynamic";

const safeFetch = async <T,>(fetcher: () => Promise<T>): Promise<T> => {
  const skipping = process.env.SKIP_DB_ON_BUILD === "1" && process.env.NEXT_PHASE === "phase-production-build";
  if (skipping) return [] as unknown as T;
  try {
    return await fetcher();
  } catch (error) {
    console.error("Sidebar category fetch failed", error);
    return [] as unknown as T;
  }
};

export default async function Sidebar() {
  const [storageCategories, packagingCategories, transportCategories] = await Promise.all([
    safeFetch(() => getStorageMeanCategories() as Promise<StorageMeanCategory[]>),
    safeFetch(() => getPackagingMeanCategories() as Promise<PackagingMeanCategory[]>),
    safeFetch(() => getTransportMeanCategories() as Promise<TransportMeanCategory[]>),
  ]);

  const sidebarStorageCategories: SidebarClientCategory[] = (storageCategories ?? [])
    .filter((category) => Boolean(category.slug))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));

  const sidebarPackagingCategories: SidebarClientCategory[] = (packagingCategories ?? [])
    .filter((category) => Boolean(category.slug))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));

  const sidebarTransportCategories: SidebarClientCategory[] = (transportCategories ?? [])
    .filter((category) => Boolean(category.slug))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));

  return (
    <SidebarClient
      storageCategories={sidebarStorageCategories}
      packagingCategories={sidebarPackagingCategories}
      transportCategories={sidebarTransportCategories}
    />
  );
}
