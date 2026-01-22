import type { Prisma } from "@prisma/client";
import PackagingMeanForm from "./packaging-mean.form";
import { basePackagingMeanSchema } from "./base-packaging-mean-schema";

export { basePackagingMeanSchema };

export type PackagingMeanRegistryEntry = {
  Form: typeof PackagingMeanForm;
  schema: typeof basePackagingMeanSchema;
  include: Prisma.PackagingMeanInclude;
};

const sharedEntry: PackagingMeanRegistryEntry = {
  Form: PackagingMeanForm,
  schema: basePackagingMeanSchema,
  include: {
    images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
    packagingMeanCategory: true,
    plant: true,
    flow: true,
    supplier: true,
    parts: { include: { part: { include: { partFamily: true, project: true } } } },
    accessories: { include: { accessory: true } },
  },
};

export const packagingMeanRegistry: Record<string, PackagingMeanRegistryEntry> = {};

export const getPackagingMeanRegistryEntry = (slug: string | null | undefined): PackagingMeanRegistryEntry | undefined => {
  if (!slug) return undefined;
  return packagingMeanRegistry[slug] ?? sharedEntry;
};

export type PackagingMeanCategorySlug = keyof typeof packagingMeanRegistry;

export const resolvePackagingMeanSlug = (slug: string | null | undefined): string | undefined => {
  if (!slug) return undefined;
  return slug;
};
