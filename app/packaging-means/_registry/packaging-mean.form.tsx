"use client";

import type { Flow, PackagingMeanCategory, Plant, Supplier } from "@prisma/client";
import { SharedPackagingMeanForm, type PackagingMeanWithRelations } from "./shared-packaging-mean-form";

type Props = {
  mode: "create" | "edit";
  category: PackagingMeanCategory;
  packaging?: PackagingMeanWithRelations | null;
  plants: Plant[];
  flows: Flow[];
  suppliers: Supplier[];
  countries: Array<{ id: string; name: string }>;
  accessories: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  partFamilies: Array<{ id: string; name: string }>;
  onSubmit: (payload: FormData) => Promise<{ status: "idle" | "success" | "error"; fieldErrors?: Record<string, string>; message?: string }>;
};

export default function PackagingMeanForm(props: Props) {
  return <SharedPackagingMeanForm {...props} />;
}
