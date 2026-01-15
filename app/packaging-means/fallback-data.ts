import { slugifyValue } from "@/lib/utils";

type PackagingCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RawPackagingCategory = {
  name: string;
  description: string;
  imageUrl: string;
};

const RAW_PACKAGING_CATEGORIES: RawPackagingCategory[] = [
  {
    name: "Trolley",
    description: "Multipurpose trolley designed for quick moves between inbound docks and kitting cells.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  },
  {
    name: "Kitting Trolley",
    description: "Ergonomic trolley optimized for staging components near assembly lines.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    name: "Picking Trolley",
    description: "Narrow footprint trolley used for high-frequency picking runs.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  },
  {
    name: "Shopstock Hook",
    description: "Heavy-duty hook system that keeps frequently used parts within reach.",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
  },
  {
    name: "Transtocker Hook",
    description: "Overhead hook compatible with automatic transtockers for fast swaps.",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  },
  {
    name: "Tallboy",
    description: "Vertical storage tower maximizing cubic efficiency in tight aisles.",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  },
  {
    name: "HD Rack",
    description: "High-density racking unit supporting palletized and loose packaging.",
    imageUrl: "https://images.unsplash.com/photo-1560464024-54c5c887c1bf",
  },
  {
    name: "Plastic box",
    description: "Durable plastic totes for closed-loop shuttles between suppliers and plant.",
    imageUrl: "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
  },
  {
    name: "High density Tower",
    description: "Automated tower providing dense storage for small packaging assets.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
  },
];

const FALLBACK_TIMESTAMP = new Date("2024-01-01T00:00:00.000Z");

const createRecord = (category: RawPackagingCategory, index: number): PackagingCategoryRecord => {
  const slugBase = slugifyValue(category.name);
  const slug = slugBase.length ? slugBase : `packaging-${index + 1}`;

  return {
    id: `packaging-fallback-${slug}`,
    name: category.name,
    slug,
    description: category.description,
    imageUrl: category.imageUrl,
    createdAt: new Date(FALLBACK_TIMESTAMP),
    updatedAt: new Date(FALLBACK_TIMESTAMP),
  };
};

const PACKAGING_FALLBACK_RECORDS: PackagingCategoryRecord[] = RAW_PACKAGING_CATEGORIES.map(createRecord);

const PACKAGING_FALLBACK_BY_ID = new Map(PACKAGING_FALLBACK_RECORDS.map((category) => [category.id, category]));
const PACKAGING_FALLBACK_BY_SLUG = new Map(PACKAGING_FALLBACK_RECORDS.map((category) => [category.slug, category]));

const cloneCategory = (category: PackagingCategoryRecord): PackagingCategoryRecord => ({
  ...category,
  createdAt: new Date(category.createdAt),
  updatedAt: new Date(category.updatedAt),
});

export function listPackagingCategoryFallbacks() {
  return PACKAGING_FALLBACK_RECORDS.map(cloneCategory);
}

export function findPackagingCategoryFallbackById(id: string) {
  const category = PACKAGING_FALLBACK_BY_ID.get(id);
  return category ? cloneCategory(category) : null;
}

export function findPackagingCategoryFallbackBySlug(slug: string) {
  const category = PACKAGING_FALLBACK_BY_SLUG.get(slug);
  return category ? cloneCategory(category) : null;
}
