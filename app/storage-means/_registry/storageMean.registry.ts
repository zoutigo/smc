import { z } from "zod";
import type { Prisma } from "@prisma/client";
import ManualTranstockerForm from "./manual-transtocker.form";
import AutoTranstockerForm from "./auto-transtocker.form";

export const baseStorageMeanSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().int().min(0),
  description: z.string().optional(),
  supplierId: z.string().uuid().optional().nullable(),
  plantId: z.string().uuid(),
  flowId: z.string().uuid().optional().nullable(),
});

export const manualTranstockerSchema = baseStorageMeanSchema.extend({
  emptyReturnLanes: z.coerce.number().int().min(0),
  lanes: z.array(
    z.object({
      laneId: z.string().uuid(),
      quantity: z.coerce.number().int().min(0),
    })
  ).default([]),
});

export const autoTranstockerSchema = baseStorageMeanSchema.extend({
  emptyReturnLanes: z.coerce.number().int().min(0),
  lanes: z.array(
    z.object({
      laneId: z.string().uuid(),
      quantity: z.coerce.number().int().min(0),
    })
  ).default([]),
});

export type StorageMeanRegistryEntry = {
  Form: typeof ManualTranstockerForm | typeof AutoTranstockerForm;
  schema: typeof manualTranstockerSchema | typeof autoTranstockerSchema;
  include: Prisma.StorageMeanInclude;
};

export const storageMeanRegistry = {
  "manual-transtocker": {
    Form: ManualTranstockerForm,
    schema: manualTranstockerSchema,
    include: {
      manualTranstocker: { include: { lanes: { include: { lane: true } } } },
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      flow: true,
      supplier: true,
    },
  },
  "auto-transtocker": {
    Form: AutoTranstockerForm,
    schema: autoTranstockerSchema,
    include: {
      autoTranstocker: { include: { lanes: { include: { lane: true } } } },
      images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
      storageMeanCategory: true,
      plant: true,
      flow: true,
      supplier: true,
    },
  },
} satisfies Record<"manual-transtocker" | "auto-transtocker", StorageMeanRegistryEntry>;

const storageMeanSlugAliases: Record<string, keyof typeof storageMeanRegistry> = {
  "automated-transtocker": "auto-transtocker",
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
