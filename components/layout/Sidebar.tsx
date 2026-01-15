import type { PackagingCategory, StorageMeanCategory } from "@prisma/client";

import { getStorageMeanCategories } from "@/app/storage-means/actions";
import { getPackagingCategories } from "@/app/packaging-means/actions";

import SidebarClient, { type SidebarClientCategory } from "./SidebarClient";

const safeFetch = async <T,>(fetcher: () => Promise<T>): Promise<T> => {
  try {
    return await fetcher();
  } catch (error) {
    console.error("Sidebar category fetch failed", error);
    return [] as unknown as T;
  }
};

export default async function Sidebar() {
  const [storageCategories, packagingCategories] = await Promise.all([
    safeFetch(() => getStorageMeanCategories() as Promise<StorageMeanCategory[]>),
    safeFetch(() => getPackagingCategories() as Promise<PackagingCategory[]>),
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

  return <SidebarClient storageCategories={sidebarStorageCategories} packagingCategories={sidebarPackagingCategories} />;
}
