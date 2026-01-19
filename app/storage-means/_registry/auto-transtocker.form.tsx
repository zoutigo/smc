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

export default function AutoTranstockerForm(props: Props) {
  const guidance: StepConfigItem[] = [
    {
      key: "preparation",
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Collect plant/flow links and PLC brand upfront.</li>
            <li>Measure lane dimensions to avoid guesswork.</li>
            <li>Pick an image that represents this auto transtocker.</li>
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
            <li>Set name/description and SOP realistically.</li>
            <li>Pick plant/flow or create inline if missing.</li>
            <li>Provide PLC brand to simplify maintenance.</li>
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
            <li>Add lanes that reflect the automated flow.</li>
            <li>Use numeric quantities only.</li>
            <li>Remove unused lanes before moving on.</li>
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
            <li>Ensure licensing is clear for chosen images.</li>
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
            <li>Verify PLC brand, lanes, and pricing.</li>
            <li>Confirm plant/flow choices are correct.</li>
            <li>Ensure at least one image is attached.</li>
          </ul>
        </div>
      ),
    },
  ];

  return <SharedStorageMeanForm {...props} stepConfig={guidance} />;
}
