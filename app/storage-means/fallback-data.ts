import { slugifyValue } from "@/lib/utils";

type StorageMeanCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  image: {
    id: string;
    imageUrl: string;
    plantId: null;
    packagingMeanCategoryId: null;
    storageMeanCategoryId: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

type RawStorageMeanCategory = {
  name: string;
  description: string;
  imageUrl: string;
};

const RAW_STORAGE_MEAN_CATEGORIES: RawStorageMeanCategory[] = [
  {
    name: "Automated Hanging Shopstock",
    description: "Robot-managed hanging aisles buffering painted subassemblies with real-time inventory tracking.",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
  },
  {
    name: "Manual Hanging Shopstock",
    description: "Operator-friendly hanging rails that keep bulky trim sets within reach of assembly teams.",
    imageUrl: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
  },
  {
    name: "Automated Transtocker",
    description: "High-throughput transtockers feeding cells with sequenced components under automated control.",
    imageUrl: "https://images.unsplash.com/photo-1489515215877-9227ee91edef",
  },
  {
    name: "Manual Transtocker",
    description: "Manually dispatched transtockers supporting flexible replenishment during short runs.",
    imageUrl: "https://images.unsplash.com/photo-1452698325353-b89e0069974b",
  },
  {
    name: "High Bay Rack",
    description: "High-bay rack structure maximizing cubic density for pallets and oversized loads.",
    imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
  },
  {
    name: "ARSR (automated Storage and Retrieval Systems)",
    description: "Automated storage and retrieval grid orchestrating deep-lane buffering for fast movers.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  },
  {
    name: "CRM (conveyor on rail Motorized)",
    description: "Powered conveyor-on-rail network routing totes across mezzanines and paint shops.",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
  },
];

const FALLBACK_TIMESTAMP = new Date("2024-01-01T00:00:00.000Z");

const createRecord = (category: RawStorageMeanCategory, index: number): StorageMeanCategoryRecord => {
  const slugBase = slugifyValue(category.name);
  const slug = slugBase.length ? slugBase : `storage-${index + 1}`;
  const imageId = `storage-image-${index + 1}`;

  return {
    id: `storage-fallback-${slug}`,
    name: category.name,
    slug,
    description: category.description,
    image: {
      id: imageId,
      imageUrl: category.imageUrl,
      plantId: null,
      packagingMeanCategoryId: null,
      storageMeanCategoryId: `storage-fallback-${slug}`,
      createdAt: new Date(FALLBACK_TIMESTAMP),
      updatedAt: new Date(FALLBACK_TIMESTAMP),
    },
    createdAt: new Date(FALLBACK_TIMESTAMP),
    updatedAt: new Date(FALLBACK_TIMESTAMP),
  };
};

const STORAGE_FALLBACK_RECORDS: StorageMeanCategoryRecord[] = RAW_STORAGE_MEAN_CATEGORIES.map(createRecord);

const STORAGE_FALLBACK_BY_ID = new Map(STORAGE_FALLBACK_RECORDS.map((category) => [category.id, category]));
const STORAGE_FALLBACK_BY_SLUG = new Map(STORAGE_FALLBACK_RECORDS.map((category) => [category.slug, category]));

const STORAGE_SLUG_ALIASES: Record<string, string> = {
  // Legacy / mistyped slug without the second "r" in ARSR
  "ars-automated-storage-and-retrieval-systems": "arsr-automated-storage-and-retrieval-systems",
};

const normalize = (slug: unknown) => {
  if (typeof slug !== "string" || !slug.trim().length) return "";
  return slugifyValue(slug);
};

const resolveAlias = (slug: unknown) => {
  const safeSlug = typeof slug === "string" ? slug : "";
  const direct = STORAGE_SLUG_ALIASES[safeSlug];
  if (direct) return direct;

  const normalizedSlug = normalize(safeSlug);
  return STORAGE_SLUG_ALIASES[normalizedSlug] ?? normalizedSlug;
};

const cloneCategory = (category: StorageMeanCategoryRecord): StorageMeanCategoryRecord => ({
  ...category,
  createdAt: new Date(category.createdAt),
  updatedAt: new Date(category.updatedAt),
  image: category.image
    ? {
        ...category.image,
        createdAt: new Date(category.image.createdAt),
        updatedAt: new Date(category.image.updatedAt),
      }
    : null,
});

export function listStorageMeanCategoryFallbacks() {
  return STORAGE_FALLBACK_RECORDS.map(cloneCategory);
}

export function findStorageMeanCategoryFallbackById(id: string) {
  const category = STORAGE_FALLBACK_BY_ID.get(id);
  return category ? cloneCategory(category) : null;
}

export function findStorageMeanCategoryFallbackBySlug(slug: string) {
  const resolvedSlug = resolveAlias(slug);
  const category =
    STORAGE_FALLBACK_BY_SLUG.get(slug) ||
    STORAGE_FALLBACK_BY_SLUG.get(resolvedSlug) ||
    STORAGE_FALLBACK_BY_SLUG.get(normalize(slug));
  return category ? cloneCategory(category) : null;
}

export function listStorageMeanCategoryAliasSlugs() {
  return Object.keys(STORAGE_SLUG_ALIASES);
}
