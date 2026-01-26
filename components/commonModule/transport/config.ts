import { TransportMeanForm } from "@/app/transport-means/_registry/transport-mean.form";
import { transportMeanRegistry } from "@/app/transport-means/_registry/transportMean.registry";

export const transportModuleConfig = {
  name: "transport-means",
  registryPath: "@/app/transport-means/_registry/transportMean.registry",
  forms: [
    { component: TransportMeanForm, description: "Shared transport mean multistep form" },
  ],
  pages: [
    { path: "/transport-means", description: "Catalogue categories page" },
    { path: "/transport-means/[slug]", description: "Category listing page" },
    { path: "/transport-means/[slug]/new", description: "Create transport mean" },
    { path: "/transport-means/[slug]/[id]", description: "Detail page" },
    { path: "/transport-means/[slug]/[id]/edit", description: "Edit page" },
  ],
  actions: {
    create: "@/app/transport-means/[slug]/actions#createTransportMeanAction",
    update: "@/app/transport-means/[slug]/actions#updateTransportMeanAction",
  },
  notes: "Config placeholder for transport common module.",
};

export type TransportRegistry = typeof transportMeanRegistry;
