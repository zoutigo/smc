import type { Prisma } from "@prisma/client";
import SharedStorageMeanForm from "./shared-storage-mean-form";

type SpecType = "lanes" | "highbay";

export type StorageMeanRegistryEntry = {
  Form: typeof SharedStorageMeanForm;
  specType: SpecType;
  include: Prisma.StorageMeanInclude;
};

export const storageMeanRegistry = {
  "manual-transtocker": {
    Form: SharedStorageMeanForm,
    specType: "lanes",
    include: {
      laneGroups: { include: { lanes: true } },
      highBayRack: true,
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      supplier: true,
      flows: { include: { flow: true } },
      staffingLines: true,
    },
  },
  "auto-transtocker": {
    Form: SharedStorageMeanForm,
    specType: "lanes",
    include: {
      laneGroups: { include: { lanes: true } },
      highBayRack: true,
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      supplier: true,
      flows: { include: { flow: true } },
      staffingLines: true,
    },
  },
  "manual-hanging-shopstock": {
    Form: SharedStorageMeanForm,
    specType: "lanes",
    include: {
      laneGroups: { include: { lanes: true } },
      highBayRack: true,
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      supplier: true,
      flows: { include: { flow: true } },
      staffingLines: true,
    },
  },
  "automated-hanging-shopstock": {
    Form: SharedStorageMeanForm,
    specType: "lanes",
    include: {
      laneGroups: { include: { lanes: true } },
      highBayRack: true,
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      supplier: true,
      flows: { include: { flow: true } },
      staffingLines: true,
    },
  },
  crm: {
    Form: SharedStorageMeanForm,
    specType: "lanes",
    include: {
      laneGroups: { include: { lanes: true } },
      highBayRack: true,
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      supplier: true,
      flows: { include: { flow: true } },
      staffingLines: true,
    },
  },
  "high-bay-rack": {
    Form: SharedStorageMeanForm,
    specType: "highbay",
    include: {
      laneGroups: { include: { lanes: true } },
      highBayRack: true,
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      supplier: true,
      flows: { include: { flow: true } },
      staffingLines: true,
    },
  },
  arsr: {
    Form: SharedStorageMeanForm,
    specType: "highbay",
    include: {
      laneGroups: { include: { lanes: true } },
      highBayRack: true,
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      supplier: true,
      flows: { include: { flow: true } },
      staffingLines: true,
    },
  },
} satisfies Record<string, StorageMeanRegistryEntry>;

const storageMeanSlugAliases: Record<string, keyof typeof storageMeanRegistry> = {
  "automated-transtocker": "auto-transtocker",
  "manual-transtocker": "manual-transtocker",
  "manual-hanging-shopstock": "manual-hanging-shopstock",
  "automated-hanging-shopstock": "automated-hanging-shopstock",
  crm: "crm",
  "high-bay-rack": "high-bay-rack",
  arsr: "arsr",
};

export type StorageMeanCategorySlug = keyof typeof storageMeanRegistry;

export const resolveStorageMeanSlug = (slug: string): StorageMeanCategorySlug | undefined => {
  if (!slug) return undefined;
  const direct = slug as StorageMeanCategorySlug;
  if (storageMeanRegistry[direct]) return direct;
  const aliased = storageMeanSlugAliases[slug];
  if (aliased && storageMeanRegistry[aliased]) return aliased;
  return undefined;
};
