import type { Prisma } from "@prisma/client";
import { baseTransportMeanSchema } from "./base-transport-mean-schema";
import { TransportMeanForm } from "./transport-mean.form";

export const transportMeanRegistry: Record<string, { include: Prisma.TransportMeanInclude; Form: typeof TransportMeanForm; schema: typeof baseTransportMeanSchema }> = {};

export const getTransportMeanRegistryEntry = (slug: string | null | undefined) => {
  if (!slug) return undefined;
  return transportMeanRegistry[slug];
};

export const resolveTransportMeanSlug = (slug: string | null | undefined): string | undefined => {
  if (!slug) return undefined;
  if (transportMeanRegistry[slug]) return slug;
  return slug;
};
