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
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
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
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
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
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
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
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
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
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
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
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
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
      packagingLinks: {
        include: {
          packagingMean: {
            select: {
              id: true,
              name: true,
              price: true,
              packagingMeanCategory: { select: { name: true } },
            },
          },
        },
      },
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
