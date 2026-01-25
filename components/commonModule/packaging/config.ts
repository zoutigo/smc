import { SharedPackagingMeanForm } from "@/app/packaging-means/_registry/shared-packaging-mean-form";
import { packagingMeanRegistry } from "@/app/packaging-means/_registry/packagingMean.registry";

import type { PackagingModuleConfig } from "./types";

export const packagingModuleConfig: PackagingModuleConfig = {
  name: "packaging-means",
  registryPath: "@/app/packaging-means/_registry/packagingMean.registry",
  forms: [
    {
      component: SharedPackagingMeanForm as PackagingModuleConfig["forms"][number]["component"],
      description: "Shared packaging mean form (multistep)"
    },
  ],
  pages: [
    { path: "/packaging-means", description: "Catalogue categories page" },
    { path: "/packaging-means/[slug]", description: "Category listing page" },
    { path: "/packaging-means/[slug]/new", description: "Create packaging mean" },
    { path: "/packaging-means/[slug]/[id]", description: "Detail page" },
    { path: "/packaging-means/[slug]/[id]/edit", description: "Edit page" },
  ],
  actions: {
    create: "@/app/packaging-means/[slug]/actions#createPackagingMeanAction",
    update: "@/app/packaging-means/[slug]/actions#updatePackagingMeanAction",
  },
  notes: "Config placeholder for future module builder. Uses packagingMeanRegistry entries (spec types, includes).",
};

export type PackagingRegistry = typeof packagingMeanRegistry;

