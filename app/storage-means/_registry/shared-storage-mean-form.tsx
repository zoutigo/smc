"use client";

import React, { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { StorageMean } from "@prisma/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import {
  createStorageMeanAction,
  updateStorageMeanAction,
  type StorageMeanActionState,
} from "@/app/storage-means/[slug]/actions";
import { useCreateStorageMeanStore } from "./useCreateStorageMeanStore";
import { PlantInput } from "@/components/forms/PlantInput";
import { FlowInput } from "@/components/forms/FlowInput";
import { ImageInput } from "@/components/forms/ImageInput";
import { SupplierInput } from "@/components/forms/SupplierInput";
import { NameInput } from "@/components/forms/NameInput";
import { PriceInput } from "@/components/forms/PriceInput";
import { DescriptionInput } from "@/components/forms/DescriptionInput";
import { SopInput } from "@/components/forms/SopInput";
import {
  storageMeanBasicsSchema,
  storageMeanDescriptionSchema,
  storageMeanNameSchema,
  storageMeanPriceSchema,
  storageMeanSopSchema,
} from "@/lib/validation/storage-mean";
import { MeanMultistepForm, type StepItem } from "@/components/forms/MeanMultistepForm";

type StorageMeanWithRelations = StorageMean & {
  manualTranstocker?: { lanes: Array<{ lane: { length: number; width: number; height: number }; quantity: number }> };
  autoTranstocker?: { lanes: Array<{ lane: { length: number; width: number; height: number }; quantity: number }> };
  images?: Array<{ imageId: string; image: { imageUrl: string } }>;
};

type BaseFormProps = {
  mode: "create" | "edit";
  categoryId: string;
  categorySlug: string;
  storageMean?: StorageMeanWithRelations | null;
  plants: Array<{ id: string; name: string }>;
  flows: Array<{ id: string; from: string; to: string; slug: string }>;
  countries: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
};

const stepOneSchema = storageMeanBasicsSchema;

const stepTwoSchema = z
  .array(
    z.object({
      length: z.coerce.number().int().min(1, "Length is required"),
      width: z.coerce.number().int().min(1, "Width is required"),
      height: z.coerce.number().int().min(1, "Height is required"),
      quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    })
  )
  .min(1, "Add at least one lane");
const stepThreeSchema = z.array(z.instanceof(File));

export function SharedStorageMeanForm({ mode, categoryId, categorySlug, storageMean, plants, flows, countries, suppliers }: BaseFormProps) {
  const router = useRouter();
  const initialState: StorageMeanActionState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    mode === "edit" ? updateStorageMeanAction : createStorageMeanAction,
    initialState
  );

  const store = useCreateStorageMeanStore();
  const isEdit = mode === "edit";
  const heroTitle = `${categorySlug.replace(/-/g, " ")} ${isEdit ? "Update" : "Creation"}`;
  const heroSubtitle = isEdit
    ? "Review existing data, adjust what changed, and save."
    : "Provide details to create this storage mean.";
  const resetStore = useCreateStorageMeanStore((s) => s.reset);
  const [stepError, setStepError] = useState<string | null>(null);
  const [plantsList, setPlantsList] = useState(plants);
  const [flowsList, setFlowsList] = useState(flows);
  const [suppliersList, setSuppliersList] = useState(suppliers);
  const { show } = useConfirmMessage();
  const handledSuccess = useRef(false);
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string; price?: string; sop?: string }>({});

  useEffect(() => {
    if (state.status === "success" && !handledSuccess.current) {
      handledSuccess.current = true;
      const message = mode === "edit" ? "Storage mean updated." : "Storage mean created.";
      show(message, "success");
      const target = isEdit && storageMean?.id ? `/storage-means/${categorySlug}/${storageMean.id}` : `/storage-means/${categorySlug}`;
      const redirectDelay = process.env.NODE_ENV === "test" ? 0 : 2000;
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
      redirectTimeout.current = setTimeout(() => {
        router.push(target);
        resetStore();
      }, redirectDelay);
    }
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
        redirectTimeout.current = null;
      }
    };
  }, [state.status, mode, categorySlug, resetStore, router, show, isEdit, storageMean?.id]);

  useEffect(() => {
    if (mode === "create") {
      resetStore();
      return;
    }
    if (mode === "edit" && storageMean) {
      resetStore();
      const lanes: Array<{ length: number; width: number; height: number; quantity: number }> =
        storageMean.manualTranstocker?.lanes?.map((l) => ({
          length: l.lane.length,
          width: l.lane.width,
          height: l.lane.height,
          quantity: l.quantity,
        })) ||
        storageMean.autoTranstocker?.lanes?.map((l) => ({
          length: l.lane.length,
          width: l.lane.width,
          height: l.lane.height,
          quantity: l.quantity,
        })) ||
        [];
      const sop = storageMean.sop ? new Date(storageMean.sop).toISOString().slice(0, 10) : "";
      const exists = String(storageMean.status) === "PROJECT" ? "project" : "existing";
      useCreateStorageMeanStore.setState({
        step: 1,
        name: storageMean.name ?? "",
        description: storageMean.description ?? "",
        plantId: storageMean.plantId ?? "",
        supplierId: storageMean.supplierId ?? "",
        price: storageMean.price ?? 0,
        sop,
        flowId: storageMean.flowId ?? "",
        exists,
        lanes,
        images: [],
        existingImages:
          storageMean.images?.map((img) => ({
            id: img.imageId,
            url: img.image.imageUrl,
          })) ?? [],
        removedImageIds: [],
      });
    }
  }, [mode, resetStore, storageMean]);

  const handleBasicsNext = () => {
    const result = stepOneSchema.safeParse({
      name: store.name,
      description: store.description,
      plantId: store.plantId,
      price: store.price,
      sop: store.sop,
      flowId: store.flowId,
      supplierId: store.supplierId || undefined,
      exists: store.exists,
    });
    if (!result.success) {
      setStepError(result.error.issues[0]?.message ?? "Please fill all required fields");
      const nextErrors: Partial<typeof fieldErrors> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string" && (key as keyof typeof fieldErrors)) {
          nextErrors[key as keyof typeof fieldErrors] = issue.message;
        }
      });
      setFieldErrors(nextErrors);
      return;
    }
    setStepError(null);
    setFieldErrors({});
    store.next();
  };

  const handleStepTwoNext = () => {
    const result = stepTwoSchema.safeParse(store.lanes);
    if (!result.success) {
      setStepError(result.error.issues[0]?.message ?? "Please add at least one lane or leave empty.");
      return;
    }
    setStepError(null);
    store.next();
  };

  const handleSubmit = async (formData: FormData) => {
    if (store.step < 5) return;
    const imageFiles = store.images;
    const imageValidation = stepThreeSchema.safeParse(imageFiles);
    const totalImages = store.existingImages.length + imageFiles.length;
    if (!imageValidation.success || totalImages < 1) {
      setStepError("Add at least one image.");
      return;
    }
    setStepError(null);
    formData.set("categoryId", categoryId);
    if (isEdit && storageMean?.id) formData.set("id", storageMean.id);
    formData.set("name", store.name);
    formData.set("description", store.description);
    formData.set("price", String(store.price));
    formData.set("plantId", store.plantId);
    formData.set("sop", store.sop);
    if (store.flowId) formData.set("flowId", store.flowId);
    if (store.supplierId) formData.set("supplierId", store.supplierId);
    formData.set("status", "DRAFT");
    formData.set("lanes", JSON.stringify(store.lanes));
    if (store.removedImageIds.length) {
      formData.set("removeImageIds", JSON.stringify(store.removedImageIds));
    }
    imageFiles.forEach((file, idx) => {
      formData.set(`imageFile_${idx}`, file);
    });
    await new Promise<void>((resolve) => {
      startTransition(() => {
        Promise.resolve(formAction(formData)).finally(resolve);
      });
    });
  };

  const guidancePrep = (
    <div>
      <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
      <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
        <li>Collect plant/flow info beforehand to speed up creation.</li>
        <li>Have lane measurements ready to avoid guesswork.</li>
        <li>Choose high-quality images for better cards.</li>
      </ul>
    </div>
  );

  const guidanceBasics = (
    <div>
      <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
      <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
        <li>Pick an existing plant or create one inline if it is missing.</li>
        <li>Provide a realistic SOP date for this {categorySlug}.</li>
        <li>Keep the name and description concise and specific.</li>
      </ul>
    </div>
  );

  const guidanceLanes = (
    <div>
      <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
      <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
        <li>Add lane dimensions (L/W/H) that match this {categorySlug}.</li>
        <li>Use numeric quantities only.</li>
        <li>Remove unnecessary lanes before continuing.</li>
      </ul>
    </div>
  );

  const guidanceImages = (
    <div>
      <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
      <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
        <li>Add at least one representative image.</li>
        <li>Prefer common formats (jpg/png) for faster previews.</li>
        <li>Ensure you have rights to use the selected images.</li>
      </ul>
    </div>
  );

  const guidanceSummary = (
    <div>
      <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
      <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
        <li>Double-check lanes and prices before submit.</li>
        <li>Ensure plant/flow are correct; go back if needed.</li>
        <li>Confirm at least one image is present.</li>
      </ul>
    </div>
  );

  const steps: StepItem[] = [
    {
      key: "preparation",
      label: "Preparation",
      description: isEdit
        ? "What to review before updating this storage mean."
        : "What to prepare before creating this storage mean.",
      body: (
        <div className="space-y-3 rounded-xl border border-smc-border/70 bg-white p-4">
          <h3 className="text-base font-semibold text-smc-text">Preparation checklist</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-smc-text-muted">
            <li>Basic details: name, description, SOP date, estimated price.</li>
            <li>Existing plant and flow to associate (or be ready to create them).</li>
            <li>Lane dimensions (length/width/height in mm) and quantities.</li>
            <li>At least one image that represents the storage mean.</li>
          </ul>
        </div>
      ),
      footer: (
        <div className="flex justify-end rounded-xl bg-smc-border/40 px-4 py-3 shadow-inner">
          <Button
            type="button"
            onClick={() => {
              setStepError(null);
              store.next();
            }}
          >
            Start
          </Button>
        </div>
      ),
      guidance: guidancePrep,
    },
    {
      key: "basics",
      label: "Basics",
      description: isEdit ? "Review and adjust details before saving updates." : "Details & context",
      body: (
        <div className="space-y-3 rounded-xl border border-smc-border/70 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <NameInput
              value={store.name}
              onChange={(val) => {
                store.updateField("name", val);
                const parsed = storageMeanNameSchema.safeParse(val);
                setFieldErrors((prev) => ({ ...prev, name: parsed.success ? undefined : parsed.error.issues[0]?.message }));
              }}
              error={fieldErrors.name}
            />
            <PriceInput
              value={store.price}
              onChange={(val) => {
                store.updateField("price", val);
                const parsed = storageMeanPriceSchema.safeParse(val);
                setFieldErrors((prev) => ({ ...prev, price: parsed.success ? undefined : parsed.error.issues[0]?.message }));
              }}
              error={fieldErrors.price}
            />
          </div>
          <DescriptionInput
            value={store.description}
            onChange={(val) => {
              store.updateField("description", val);
              const parsed = storageMeanDescriptionSchema.safeParse(val);
              setFieldErrors((prev) => ({
                ...prev,
                description: parsed.success ? undefined : parsed.error.issues[0]?.message,
              }));
            }}
            error={fieldErrors.description}
          />
          <div className="space-y-3">
            <PlantInput
              value={store.plantId}
              onChange={(id) => {
                store.updateField("plantId", id);
              }}
              plants={plantsList}
              countries={countries}
              required
              onCreated={(plant) => setPlantsList((prev) => [...prev, plant])}
            />
            <SupplierInput
              value={store.supplierId ?? ""}
              onChange={(id) => store.updateField("supplierId", id)}
              suppliers={suppliersList}
              countries={countries}
              onCreated={(supplier) => setSuppliersList((prev) => [...prev, supplier])}
              label="Supplier (optional)"
            />
            <FlowInput
              value={store.flowId ?? ""}
              onChange={(id) => store.updateField("flowId", id)}
              flows={flowsList}
              onCreated={(flow) => setFlowsList((prev) => [...prev, flow])}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SopInput
              value={store.sop}
              onChange={(val) => {
                store.updateField("sop", val);
                const parsed = storageMeanSopSchema.safeParse(val);
                setFieldErrors((prev) => ({ ...prev, sop: parsed.success ? undefined : parsed.error.issues[0]?.message }));
              }}
              error={fieldErrors.sop}
            />
            <div>
              <label className="block text-sm font-semibold text-smc-text">Existence</label>
              <div className="mt-1 flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="exists"
                    value="existing"
                    checked={store.exists === "existing"}
                    onChange={() => store.updateField("exists", "existing")}
                  />
                  Already exists (status DRAFT)
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="exists"
                    value="project"
                    checked={store.exists === "project"}
                    onChange={() => store.updateField("exists", "project")}
                  />
                  In project (status DRAFT)
                </label>
              </div>
            </div>
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-between rounded-xl bg-smc-border/40 px-4 py-3 shadow-inner">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStepError(null);
              store.prev();
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleBasicsNext();
            }}
          >
            Next
          </Button>
        </div>
      ),
      guidance: guidanceBasics,
    },
    {
      key: "lanes",
      label: "Lanes",
      description: "Dimensions & counts",
      body: (
        <div className="space-y-3 rounded-xl border border-smc-border/70 bg-white p-4">
          {store.lanes.map((lane, index) => (
            <div key={index} className="grid grid-cols-5 items-center gap-2 rounded-lg border border-smc-border/70 bg-white px-3 py-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-smc-text">
                Length
                <input
                  type="number"
                  className="w-full rounded border border-smc-border/70 px-2 py-1 text-sm"
                  value={lane.length}
                  onChange={(e) =>
                    store.updateField(
                      "lanes",
                      store.lanes.map((l, i) => (i === index ? { ...l, length: Number(e.target.value) || 0 } : l))
                    )
                  }
                  placeholder="Length (mm)"
                  aria-label="Length in millimeters"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-smc-text">
                Width
                <input
                  type="number"
                  className="w-full rounded border border-smc-border/70 px-2 py-1 text-sm"
                  value={lane.width}
                  onChange={(e) =>
                    store.updateField(
                      "lanes",
                      store.lanes.map((l, i) => (i === index ? { ...l, width: Number(e.target.value) || 0 } : l))
                    )
                  }
                  placeholder="Width (mm)"
                  aria-label="Width in millimeters"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-smc-text">
                Height
                <input
                  type="number"
                  className="w-full rounded border border-smc-border/70 px-2 py-1 text-sm"
                  value={lane.height}
                  onChange={(e) =>
                    store.updateField(
                      "lanes",
                      store.lanes.map((l, i) => (i === index ? { ...l, height: Number(e.target.value) || 0 } : l))
                    )
                  }
                  placeholder="Height (mm)"
                  aria-label="Height in millimeters"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-smc-text">
                Quantity
                <input
                  type="number"
                  className="w-full rounded border border-smc-border/70 px-2 py-1 text-sm"
                  value={lane.quantity}
                  onChange={(e) =>
                    store.updateField(
                      "lanes",
                      store.lanes.map((l, i) => (i === index ? { ...l, quantity: Number(e.target.value) || 0 } : l))
                    )
                  }
                  placeholder="Qty"
                />
              </label>
              <div className="flex items-center justify-center">
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => store.removeLane(index)}
                  title="Remove lanes"
                  aria-label="Remove lane"
                  className="h-9 w-10 rounded-full"
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-smc-bg/80 px-3 py-2">
            <div className="text-sm text-smc-text">Add another lane with dimensions in mm.</div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Add lane"
              title="Add lane"
              className="h-10 w-10 rounded-full"
              onClick={() => store.addLane({ length: 0, width: 0, height: 0, quantity: 1 })}
            >
              +
            </Button>
          </div>
          {store.lanes.length === 0 ? <p className="text-sm text-smc-text-muted">No lanes added yet.</p> : null}
        </div>
      ),
      footer: (
        <div className="flex justify-between rounded-xl bg-smc-border/40 px-4 py-3 shadow-inner">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStepError(null);
              store.prev();
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleStepTwoNext();
            }}
          >
            Next
          </Button>
        </div>
      ),
      guidance: guidanceLanes,
    },
    {
      key: "images",
      label: "Images",
      description: isEdit ? "Review or replace visuals." : "Upload visuals",
      body: (
        <div className="space-y-3 rounded-xl border border-smc-border/70 bg-white p-4">
          <ImageInput
            files={store.images}
            onChange={(files) => store.setImages(files)}
            error={store.existingImages.length + store.images.length < 1 ? "Please add at least one image." : null}
            existingImages={store.existingImages}
            onRemoveExisting={(id) => store.removeExistingImage(id)}
          />
        </div>
      ),
      footer: (
        <div className="flex justify-between rounded-xl bg-smc-border/40 px-4 py-3 shadow-inner">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStepError(null);
              store.prev();
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setStepError(null);
              store.next();
            }}
          >
            Next
          </Button>
        </div>
      ),
      guidance: guidanceImages,
    },
    {
      key: "summary",
      label: "Summary",
      description: isEdit ? "Review and confirm before saving updates." : "Review and confirm before submit.",
      body: (
        <div className="space-y-2 rounded-xl border border-smc-border/70 bg-white p-4 text-sm text-smc-text">
          <h3 className="text-base font-semibold text-smc-text">Summary</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <span className="font-semibold">Name:</span> {store.name || "—"}
            </div>
            <div>
              <span className="font-semibold">Price:</span> {store.price || "—"}
            </div>
            <div>
              <span className="font-semibold">Plant:</span> {plantsList.find((p) => p.id === store.plantId)?.name || "—"}
            </div>
            <div>
              <span className="font-semibold">Flow:</span> {flowsList.find((f) => f.id === store.flowId)?.slug || "—"}
            </div>
            <div>
              <span className="font-semibold">Supplier:</span> {suppliersList.find((s) => s.id === store.supplierId)?.name || "—"}
            </div>
            <div>
              <span className="font-semibold">SOP:</span> {store.sop || "—"}
            </div>
            <div>
              <span className="font-semibold">Exists:</span> {store.exists}
            </div>
          </div>
          <div>
            <span className="font-semibold">Description:</span>{" "}
            <span className="text-smc-text-muted">{store.description || "—"}</span>
          </div>
          <div>
            <span className="font-semibold">Lanes:</span>
            {store.lanes.length ? (
              <ul className="mt-1 space-y-1 text-smc-text-muted">
                {store.lanes.map((l, idx) => (
                  <li key={idx}>
                    #{idx + 1}: {l.length} x {l.width} x {l.height} mm — qty {l.quantity}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-smc-text-muted"> None</span>
            )}
          </div>
          <div>
            <span className="font-semibold">Images:</span>
            {store.images.length || store.existingImages.length ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {store.existingImages.length ? (
                  <span className="rounded bg-smc-secondary/10 px-2 py-1 text-xs font-semibold text-smc-text">
                    Existing images kept ({store.existingImages.length})
                  </span>
                ) : null}
                {store.images.length ? (
                  <span className="rounded bg-smc-primary/10 px-2 py-1 text-xs font-semibold text-smc-primary">
                    {isEdit ? "New images" : "Images"}: {store.images.length}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-smc-text-muted"> None</span>
            )}
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-between rounded-xl bg-smc-border/40 px-4 py-3 shadow-inner">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStepError(null);
              store.prev();
            }}
          >
            Previous
          </Button>
          <Button type="submit" disabled={pending} data-final="true">
            {pending ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </div>
      ),
      guidance: guidanceSummary,
    },
  ];

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        if (submitter?.dataset?.inline === "true") return;
        if (!submitter?.dataset?.final) return;
        await handleSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-4 rounded-2xl border border-smc-border/70 bg-white/90 p-4 shadow-soft"
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="categorySlug" value={categorySlug} />
      {isEdit && storageMean?.id ? <input type="hidden" name="id" value={storageMean.id} /> : null}

      <MeanMultistepForm
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        modeLabel={isEdit ? "Edit mode" : "Create mode"}
        steps={steps}
        currentIndex={Math.max(0, store.step - 1)}
      />

      {stepError ? <p className="text-sm text-red-600">{stepError}</p> : null}
      {state.message && !stepError ? <p className="text-sm text-red-600">{state.message}</p> : null}
    </form>
  );
}
