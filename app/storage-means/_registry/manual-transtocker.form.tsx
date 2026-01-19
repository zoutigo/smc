"use client";

import type { StorageMean } from "@prisma/client";
import { SharedStorageMeanForm, type StepConfigItem } from "./shared-storage-mean-form";

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

export default function ManualTranstockerForm(props: Props) {
  const guidance: StepConfigItem[] = [
    {
      key: "preparation",
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Collect plant and flow info you will link to this manual transtocker.</li>
            <li>Measure lanes (L/W/H) ahead of time to avoid back-and-forth.</li>
            <li>Pick at least one image that clearly represents the storage mean.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "basics",
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Choose an existing plant or create it inline if missing.</li>
            <li>Provide a realistic SOP date for this manual transtocker.</li>
            <li>Keep name and description concise and specific.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "lanes",
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Add lane dimensions (L/W/H) that match the manual transtocker.</li>
            <li>Use numeric quantities only.</li>
            <li>Remove unnecessary lanes before continuing.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "images",
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Add at least one representative image.</li>
            <li>Prefer jpg/png for faster previews.</li>
            <li>Ensure you have rights to use the selected images.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "summary",
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Double-check lanes, pricing, and SOP before submitting.</li>
            <li>Ensure plant and flow are correct; go back if needed.</li>
            <li>Confirm at least one image is present.</li>
          </ul>
        </div>
      ),
    },
  ];

  return <SharedStorageMeanForm {...props} stepConfig={guidance} />;
}
