"use client";

import type { StorageMean } from "@prisma/client";
import { SharedStorageMeanForm } from "./shared-storage-mean-form";

type Props = {
  mode: "create" | "edit";
  categoryId: string;
  categorySlug: string;
  storageMean?: StorageMean | null;
  plants: Array<{ id: string; name: string }>;
  flows: Array<{ id: string; from: string; to: string; slug: string }>;
  countries: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
};

export default function AutoTranstockerForm(props: Props) {
  return <SharedStorageMeanForm {...props} />;
}
