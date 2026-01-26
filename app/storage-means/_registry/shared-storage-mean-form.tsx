"use client";

import React, { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { Prisma, StorageMean } from "@prisma/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { CustomButton } from "@/components/ui/custom-button";
import {
  createStorageMeanAction,
  updateStorageMeanAction,
  type StorageMeanActionState,
} from "@/app/storage-means/[slug]/actions";
import { useCreateStorageMeanStore } from "./useCreateStorageMeanStore";
import { PlantInput } from "@/components/forms/PlantInput";
import { FlowMultiInput } from "@/components/forms/FlowMultiInput";
import { ImageInput } from "@/components/forms/ImageInput";
import { SupplierInput } from "@/components/forms/SupplierInput";
import { NameInput } from "@/components/forms/NameInput";
import { PriceInput } from "@/components/forms/PriceInput";
import { DescriptionInput } from "@/components/forms/DescriptionInput";
import { SopInput } from "@/components/forms/SopInput";
import { MeanMultistepForm, type StepItem } from "@/components/forms/MeanMultistepForm";

type StorageMeanWithRelations = StorageMean & {
  laneGroups?: Array<{ lanes: Array<{ lengthMm: number; widthMm: number; heightMm: number; numberOfLanes: number; level: number; laneType: "EMPTIES" | "ACCUMULATION" | "EMPTIES_AND_ACCUMULATION" }> }>;
  highBayRack?: {
    numberOfLevels: number;
    numberOfBays: number;
    slotLengthMm: number;
    slotWidthMm: number;
    slotHeightMm: number;
    numberOfSlots: number;
  } | null;
  staffingLines?: Array<{
    shift: "SHIFT_1" | "SHIFT_2" | "SHIFT_3";
    workforceType: "DIRECT" | "INDIRECT";
    qty: number | Prisma.Decimal;
    role: string;
    description: string | null;
  }>;
  flows?: Array<{ flowId: string }>;
  images?: Array<{ imageId: string; image: { imageUrl: string } }>;
};

type StaffLine = {
  shift: "SHIFT_1" | "SHIFT_2" | "SHIFT_3";
  workforceType: "DIRECT" | "INDIRECT";
  qty: number;
  role: string;
  description: string;
};

export type StepKey = "preparation" | "basics" | "specs" | "staff" | "images" | "summary";

export type StepConfigItem = {
  key: StepKey;
  label?: string;
  description?: React.ReactNode;
  guidance?: React.ReactNode;
};

type BaseFormProps = {
  mode: "create" | "edit";
  categoryId: string;
  categorySlug: string;
  specType: "lanes" | "highbay";
  storageMean?: StorageMeanWithRelations | null;
  plants: Array<{ id: string; name: string }>;
  flows: Array<{ id: string; from: string; to: string; slug: string }>;
  suppliers: Array<{ id: string; name: string }>;
  countries: Array<{ id: string; name: string }>;
  stepConfig?: StepConfigItem[];
};

const basicsSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  plantId: z.string().uuid(),
  price: z.coerce.number().min(0),
  sop: z.string().min(4),
  flowIds: z.array(z.string().uuid()).min(1, "Select at least one flow"),
  supplierId: z.string().uuid().optional(),
  heightMm: z.coerce.number().int().min(0),
  usefulSurfaceM2: z.coerce.number().min(0),
  grossSurfaceM2: z.coerce.number().min(0),
});

const lanesSpecSchema = z
  .array(
    z.object({
      lengthMm: z.coerce.number().int().min(1),
      widthMm: z.coerce.number().int().min(1),
      heightMm: z.coerce.number().int().min(1),
      numberOfLanes: z.coerce.number().int().min(1),
    })
  )
  .min(1, "Add at least one lane");

const highBayBaySchema = z.object({
  numberOfLevels: z.coerce.number().int().min(1),
  slotLengthMm: z.coerce.number().int().min(1),
  slotWidthMm: z.coerce.number().int().min(1),
  slotHeightMm: z.coerce.number().int().min(1),
  numberOfSlots: z.coerce.number().int().min(1),
});
const highBaySpecSchema = z.array(highBayBaySchema).min(1, "Add at least one bay");

const imageSchema = z.array(z.instanceof(File));

export default function SharedStorageMeanForm({
  mode,
  categoryId,
  categorySlug,
  specType,
  storageMean,
  plants,
  flows,
  suppliers,
  countries,
  stepConfig,
}: BaseFormProps) {
  const router = useRouter();
  const { show } = useConfirmMessage();
  const initialState: StorageMeanActionState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    mode === "edit" ? updateStorageMeanAction : createStorageMeanAction,
    initialState
  );

  const store = useCreateStorageMeanStore();
  const totalSteps = 6;
  const resetStore = useCreateStorageMeanStore((s) => s.reset);
  const [stepError, setStepError] = useState<string | null>(null);
  const [plantsList, setPlantsList] = useState(plants);
  const flowsList = flows;
  const [suppliersList, setSuppliersList] = useState(suppliers);
  const handledSuccess = useRef(false);
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.status === "success" && !handledSuccess.current) {
      handledSuccess.current = true;
      const message = mode === "edit" ? "Storage mean updated." : "Storage mean created.";
      show(message, "success");
      const target = mode === "edit" && storageMean?.id ? `/storage-means/${categorySlug}/${storageMean.id}` : `/storage-means/${categorySlug}`;
      const delay = process.env.NODE_ENV === "test" ? 0 : 1200;
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
      redirectTimeout.current = setTimeout(() => {
        router.push(target);
        resetStore();
      }, delay);
    }
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
        redirectTimeout.current = null;
      }
    };
  }, [state.status, mode, categorySlug, resetStore, router, show, storageMean?.id]);

  useEffect(() => {
    if (mode === "create") {
      resetStore();
      return;
    }
    if (mode === "edit" && storageMean) {
      resetStore();
      const lanes =
        storageMean.laneGroups?.flatMap((lg) =>
          lg.lanes.map((l) => ({
            lengthMm: l.lengthMm,
            widthMm: l.widthMm,
            heightMm: l.heightMm,
            numberOfLanes: l.numberOfLanes,
            level: l.level ?? 0,
            laneType: l.laneType ?? "ACCUMULATION",
          }))
        ) ?? [];
      const sop = storageMean.sop ? new Date(storageMean.sop).toISOString().slice(0, 10) : "";
      useCreateStorageMeanStore.setState({
        step: 1,
        name: storageMean.name ?? "",
        description: storageMean.description ?? "",
        plantId: storageMean.plantId ?? "",
        supplierId: storageMean.supplierId ?? "",
        price: storageMean.price ?? 0,
        sop,
        flowIds: storageMean.flows?.map((f) => f.flowId) ?? [],
        exists: "existing",
        lanes,
        highBayBays: storageMean.highBayRack
          ? Array.from({ length: Math.max(1, storageMean.highBayRack.numberOfBays || 1) }).map(() => ({
              numberOfLevels: storageMean.highBayRack?.numberOfLevels ?? 0,
              numberOfSlots: storageMean.highBayRack?.numberOfSlots ?? 0,
              slotLengthMm: storageMean.highBayRack?.slotLengthMm ?? 0,
              slotWidthMm: storageMean.highBayRack?.slotWidthMm ?? 0,
              slotHeightMm: storageMean.highBayRack?.slotHeightMm ?? 0,
            }))
          : [{ numberOfLevels: 0, numberOfSlots: 0, slotLengthMm: 0, slotWidthMm: 0, slotHeightMm: 0 }],
        staffingLines:
          storageMean.staffingLines?.map((s) => ({
            shift: s.shift,
            workforceType: s.workforceType,
            qty: Number(s.qty),
            role: s.role,
            description: s.description ?? "",
          })) ?? [],
        heightMm: storageMean.heightMm ?? 0,
        usefulSurfaceM2: Number(storageMean.usefulSurfaceM2 ?? 0),
        grossSurfaceM2: Number(storageMean.grossSurfaceM2 ?? 0),
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
    const result = basicsSchema.safeParse({
      name: store.name,
      description: store.description,
      plantId: store.plantId,
      price: store.price,
      sop: store.sop,
      flowIds: store.flowIds,
      supplierId: store.supplierId || undefined,
      heightMm: store.heightMm,
      usefulSurfaceM2: store.usefulSurfaceM2,
      grossSurfaceM2: store.grossSurfaceM2,
    });
    if (!result.success) {
      setStepError(result.error.issues[0]?.message ?? "Please fill all required fields");
      const nextErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") nextErrors[key] = issue.message;
      });
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setStepError(null);
    store.next();
  };

  const handleSpecsNext = () => {
    if (specType === "lanes") {
      const result = lanesSpecSchema.safeParse(store.lanes);
      if (!result.success) {
        setStepError(result.error.issues[0]?.message ?? "Please add at least one lane.");
        return;
      }
    } else {
      const result = highBaySpecSchema.safeParse(store.highBayBays);
      if (!result.success) {
        setStepError(result.error.issues[0]?.message ?? "Please complete high-bay specs.");
        return;
      }
    }
    setStepError(null);
    store.next();
  };

  const handleImagesNext = () => {
    const totalImages = store.existingImages.length + store.images.length;
    const validation = imageSchema.safeParse(store.images);
    if (!validation.success || totalImages < 1) {
      setStepError("Add at least one image.");
      return;
    }
    setStepError(null);
    store.next();
  };

  const handleSubmit = async (formData: FormData) => {
    if (store.step < totalSteps) return;
    formData.set("categoryId", categoryId);
    formData.set("categorySlug", categorySlug);
    formData.set("specType", specType);
    if (mode === "edit" && storageMean?.id) formData.set("id", storageMean.id);
    formData.set("name", store.name);
    formData.set("description", store.description);
    formData.set("price", String(store.price));
    formData.set("plantId", store.plantId);
    formData.set("sop", store.sop);
    formData.set("flowIds", JSON.stringify(store.flowIds));
    if (store.supplierId) formData.set("supplierId", store.supplierId);
    formData.set("status", "DRAFT");
    formData.set("heightMm", String(store.heightMm));
    formData.set("usefulSurfaceM2", String(store.usefulSurfaceM2));
    formData.set("grossSurfaceM2", String(store.grossSurfaceM2));
    formData.set("lanes", JSON.stringify(store.lanes));
    formData.set("highBaySpec", JSON.stringify(store.highBayBays));
    formData.set("staffingLines", JSON.stringify(store.staffingLines));
    if (store.removedImageIds.length) formData.set("removeImageIds", JSON.stringify(store.removedImageIds));
    store.images.forEach((file, idx) => formData.set(`imageFile_${idx}`, file));

    await new Promise<void>((resolve) => {
      startTransition(() => {
        Promise.resolve(formAction(formData)).finally(resolve);
      });
    });
  };

  const updateHighBay = (idx: number, field: keyof (typeof store.highBayBays)[number], value: number) => {
    const next = [...store.highBayBays];
    next[idx] = { ...next[idx], [field]: value };
    useCreateStorageMeanStore.setState({ highBayBays: next });
  };

  const updateLane = (idx: number, field: keyof (typeof store.lanes)[number], value: number | string) => {
    const next = [...store.lanes];
    next[idx] = { ...next[idx], [field]: value };
    useCreateStorageMeanStore.setState({ lanes: next });
  };

  const handleAddStaffLine = () =>
    useCreateStorageMeanStore.setState({
      staffingLines: [
        ...store.staffingLines,
        { shift: "SHIFT_1", workforceType: "DIRECT", qty: 1, role: "Operator", description: "" },
      ],
    });

  const handleStaffChange = (idx: number, field: keyof StaffLine, value: StaffLine[keyof StaffLine]) => {
    const next = [...store.staffingLines];
    next[idx] = { ...next[idx], [field]: value };
    useCreateStorageMeanStore.setState({ staffingLines: next });
  };

  const handleRemoveStaff = (idx: number) =>
    useCreateStorageMeanStore.setState({ staffingLines: store.staffingLines.filter((_, i) => i !== idx) });

  const basicsResult = basicsSchema.safeParse({
    name: store.name,
    description: store.description,
    plantId: store.plantId,
    price: store.price,
    sop: store.sop,
    flowIds: store.flowIds,
    supplierId: store.supplierId || undefined,
    heightMm: store.heightMm,
    usefulSurfaceM2: store.usefulSurfaceM2,
    grossSurfaceM2: store.grossSurfaceM2,
  });
  const isBasicsValid = basicsResult.success;

  const heroTitle = `${mode === "edit" ? "Update" : "Create"} ${categorySlug.replace(/-/g, " ")}`;
  const heroSubtitle = mode === "edit" ? "Follow the steps to update this storage mean." : "Follow the steps to configure this storage mean.";
  const stepConfigMap = new Map((stepConfig ?? []).map((item) => [item.key, item]));

  const stepsLookup: Record<StepKey, number> = {
    preparation: 1,
    basics: 2,
    specs: 3,
    staff: 4,
    images: 5,
    summary: 6,
  };

  const renderStepError = (matchStep: StepKey) =>
    stepError && store.step === stepsLookup[matchStep] ? (
      <p className="text-sm font-semibold text-red-600">{stepError}</p>
    ) : null;

  const steps: StepItem[] = [
    {
      key: "preparation",
      label: stepConfigMap.get("preparation")?.label ?? "Preparation",
      description: stepConfigMap.get("preparation")?.description ?? "Checklist before starting",
      body: (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-smc-text">Preparation checklist</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-smc-text">
            <li>Basic details: name, description, SOP date, estimated price.</li>
            <li>Existing plant/flow to associate (or be ready to create them).</li>
            <li>Dimensions (H, surface) and the specification inputs for this category.</li>
            <li>At least one representative image.</li>
          </ul>
        </div>
      ),
      guidance:
        stepConfigMap.get("preparation")?.guidance ?? (
          <div className="space-y-2 text-sm text-smc-text">
            <p className="font-semibold">Guidance</p>
            <p>Collect plant/flow info beforehand to speed up creation.</p>
            <p>Have dimensions and lane or high-bay specs ready to avoid guesswork.</p>
            <p>Choose high-quality images for better cards.</p>
          </div>
        ),
      footer: (
        <div className="flex justify-end">
          <Button type="button" onClick={() => store.setStep(2)}>
            Start
          </Button>
        </div>
      ),
    },
    {
      key: "basics",
      label: stepConfigMap.get("basics")?.label ?? "Basics",
      description: stepConfigMap.get("basics")?.description ?? "Fill the storage mean details",
      body: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <NameInput value={store.name} onChange={(v) => store.updateField("name", v)} error={fieldErrors.name} />
            <PriceInput value={store.price} onChange={(v) => store.updateField("price", v)} />
          </div>
          <DescriptionInput value={store.description} onChange={(v) => store.updateField("description", v)} error={fieldErrors.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <PlantInput
              value={store.plantId}
              plants={plantsList ?? []}
              countries={countries}
              onChange={(id) => store.updateField("plantId", id)}
              onCreated={(newPlant) => setPlantsList((prev) => [...(prev ?? []), newPlant])}
              required
            />
            <SupplierInput
              value={store.supplierId ?? ""}
              suppliers={suppliersList ?? []}
              countries={countries}
              onChange={(id) => store.updateField("supplierId", id)}
              onCreated={(newSupplier) => setSuppliersList((prev) => [...(prev ?? []), newSupplier])}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SopInput value={store.sop} onChange={(v) => store.updateField("sop", v)} error={fieldErrors.sop} />
            <FlowMultiInput
              value={store.flowIds}
              onChange={(ids) => store.updateField("flowIds", ids)}
              flows={flowsList ?? []}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-smc-text">Height (mm)</label>
              <input
                className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                type="number"
                value={store.heightMm}
                onChange={(e) => store.updateField("heightMm", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-smc-text">Useful surface (m²)</label>
              <input
                className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                type="number"
                value={store.usefulSurfaceM2}
                onChange={(e) => store.updateField("usefulSurfaceM2", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-smc-text">Gross surface (m²)</label>
              <input
                className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                type="number"
                value={store.grossSurfaceM2}
                onChange={(e) => store.updateField("grossSurfaceM2", Number(e.target.value))}
              />
            </div>
          </div>
          {renderStepError("basics")}
        </div>
      ),
      guidance:
        stepConfigMap.get("basics")?.guidance ?? (
          <div className="space-y-2 text-sm text-smc-text">
            <p className="font-semibold">Guidance</p>
            <p>Pick the right plant and flows. Add supplier only if applicable.</p>
            <p>Provide realistic surfaces and dimensions for accurate KPIs.</p>
          </div>
        ),
      footer: (
        <div className="flex justify-end gap-2">
          <CustomButton text="Back" type="button" variant="secondary" onClick={() => store.prev()} />
          <CustomButton
            text="Continue"
            type="button"
            onClick={handleBasicsNext}
            disabled={!isBasicsValid}
          />
        </div>
      ),
    },
    {
      key: "specs",
      label: stepConfigMap.get("specs")?.label ?? "Specifications",
      description:
        stepConfigMap.get("specs")?.description ??
        (specType === "highbay" ? "High-bay rack specifications" : "Lane group specifications"),
      body:
        specType === "highbay" ? (
          <div className="space-y-4">
            {renderStepError("specs")}
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() =>
                useCreateStorageMeanStore.setState({
                  highBayBays: [
                    ...store.highBayBays,
                    { numberOfLevels: 0, numberOfSlots: 0, slotLengthMm: 0, slotWidthMm: 0, slotHeightMm: 0 },
                  ],
                })
              }
            >
              Add bay
            </Button>
            {store.highBayBays.length === 0 ? <p className="text-sm text-smc-text-muted">No bays yet.</p> : null}
            <div className="space-y-3">
              {store.highBayBays.map((bay, idx) => (
                <div key={idx} className="space-y-3 rounded-lg border border-smc-border p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-smc-text">Bay {idx + 1}</h4>
                    <Button type="button" variant="destructive" size="sm" onClick={() => useCreateStorageMeanStore.setState({ highBayBays: store.highBayBays.filter((_, i) => i !== idx) })}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <NumberField label="Levels" value={bay.numberOfLevels} onChange={(v) => updateHighBay(idx, "numberOfLevels", v)} />
                    <NumberField label="Slots" value={bay.numberOfSlots} onChange={(v) => updateHighBay(idx, "numberOfSlots", v)} />
                    <NumberField label="Slot length (mm)" value={bay.slotLengthMm} onChange={(v) => updateHighBay(idx, "slotLengthMm", v)} />
                    <NumberField label="Slot width (mm)" value={bay.slotWidthMm} onChange={(v) => updateHighBay(idx, "slotWidthMm", v)} />
                    <NumberField label="Slot height (mm)" value={bay.slotHeightMm} onChange={(v) => updateHighBay(idx, "slotHeightMm", v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {renderStepError("specs")}
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() =>
                store.addLane({
                  lengthMm: 0,
                  widthMm: 0,
                  heightMm: 0,
                  numberOfLanes: 1,
                  level: 0,
                  laneType: "ACCUMULATION",
                })
              }
            >
              Add lane
            </Button>
            {store.lanes.length === 0 ? <p className="text-sm text-smc-text-muted">No lanes yet.</p> : null}
            <div className="space-y-3">
              {store.lanes.map((lane, idx) => (
                <div key={idx} className="grid gap-3 rounded-lg border border-smc-border p-3 sm:grid-cols-6">
                  <NumberField label="Length (mm)" value={lane.lengthMm} onChange={(v) => updateLane(idx, "lengthMm", v)} />
                  <NumberField label="Width (mm)" value={lane.widthMm} onChange={(v) => updateLane(idx, "widthMm", v)} />
                  <NumberField label="Height (mm)" value={lane.heightMm} onChange={(v) => updateLane(idx, "heightMm", v)} />
                  <NumberField label="# Lanes" value={lane.numberOfLanes} onChange={(v) => updateLane(idx, "numberOfLanes", v)} />
                  <NumberField label="Level" value={lane.level} onChange={(v) => updateLane(idx, "level", v)} />
                  <div>
                    <label className="text-sm font-semibold text-smc-text">Lane type</label>
                    <select
                      className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                      value={lane.laneType}
                      onChange={(e) => updateLane(idx, "laneType", e.target.value)}
                    >
                      <option value="ACCUMULATION">Accumulation</option>
                      <option value="EMPTIES">Empties</option>
                      <option value="EMPTIES_AND_ACCUMULATION">Empties & Accumulation</option>
                    </select>
                  </div>
                  <div className="sm:col-span-6 flex justify-end">
                    <Button type="button" variant="destructive" size="sm" onClick={() => store.removeLane(idx)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      guidance:
        stepConfigMap.get("specs")?.guidance ?? (
          <div className="space-y-2 text-sm text-smc-text">
            <p className="font-semibold">Guidance</p>
            {specType === "highbay" ? (
              <>
                <p>Capture realistic rack dimensions to size the storage properly.</p>
                <p>Use average slot size if there is variation.</p>
              </>
            ) : (
              <>
                <p>Add lanes with consistent dimensions; one row per unique lane size.</p>
                <p>Keep number of lanes coherent with actual layout.</p>
              </>
            )}
          </div>
        ),
      footer: (
        <div className="flex justify-end gap-2">
          <CustomButton text="Back" type="button" variant="secondary" onClick={() => store.prev()} />
          <CustomButton text="Continue" type="button" onClick={handleSpecsNext} />
        </div>
      ),
    },
    {
      key: "staff",
      label: stepConfigMap.get("staff")?.label ?? "Staff",
      description: stepConfigMap.get("staff")?.description ?? "Optional staffing lines",
      body: (
        <div className="space-y-4">
          <Button size="sm" variant="outline" type="button" onClick={handleAddStaffLine}>
            Add staffing line
          </Button>
          {store.staffingLines.length === 0 ? <p className="text-sm text-smc-text-muted">Optional: add staffing lines.</p> : null}
          <div className="space-y-3">
            {store.staffingLines.map((line, idx) => (
              <div key={idx} className="grid gap-3 rounded-lg border border-smc-border p-3 sm:grid-cols-4">
                <div>
                  <label className="text-sm font-semibold text-smc-text">Shift</label>
                  <select
                    className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                    value={line.shift}
                    onChange={(e) => handleStaffChange(idx, "shift", e.target.value as StaffLine["shift"])}
                  >
                    <option value="SHIFT_1">Shift 1</option>
                    <option value="SHIFT_2">Shift 2</option>
                    <option value="SHIFT_3">Shift 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-smc-text">Workforce</label>
                  <select
                    className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                    value={line.workforceType}
                    onChange={(e) => handleStaffChange(idx, "workforceType", e.target.value as StaffLine["workforceType"])}
                  >
                    <option value="DIRECT">Direct</option>
                    <option value="INDIRECT">Indirect</option>
                  </select>
                </div>
                <NumberField label="Qty" value={line.qty} onChange={(v) => handleStaffChange(idx, "qty", v)} />
                <div>
                  <label className="text-sm font-semibold text-smc-text">Role</label>
                  <input
                    className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                    value={line.role}
                    onChange={(e) => handleStaffChange(idx, "role", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-sm font-semibold text-smc-text">Description</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
                    value={line.description ?? ""}
                    onChange={(e) => handleStaffChange(idx, "description", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-4 flex justify-end">
                  <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveStaff(idx)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      guidance:
        stepConfigMap.get("staff")?.guidance ?? (
          <div className="space-y-2 text-sm text-smc-text">
            <p className="font-semibold">Guidance</p>
            <p>Optional: list staffing per shift and workforce type.</p>
            <p>Describe the role to keep context for future reviews.</p>
          </div>
        ),
      footer: (
        <div className="flex justify-end gap-2">
          <CustomButton text="Back" type="button" variant="secondary" onClick={() => store.prev()} />
          <CustomButton text="Continue" type="button" onClick={() => store.next()} />
        </div>
      ),
    },
    {
      key: "images",
      label: stepConfigMap.get("images")?.label ?? "Images",
      description: stepConfigMap.get("images")?.description ?? "Add at least one image",
      body: (
        <div className="space-y-4">
          {renderStepError("images")}
          <ImageInput
            files={store.images}
            existingImages={store.existingImages}
            onChange={(files) => store.setImages(files)}
            onRemoveExisting={(id) => store.removeExistingImage(id)}
          />
        </div>
      ),
      guidance:
        stepConfigMap.get("images")?.guidance ?? (
          <div className="space-y-2 text-sm text-smc-text">
            <p className="font-semibold">Guidance</p>
            <p>Use clear images to help teams identify the storage mean.</p>
            <p>Include at least one photo; multiple angles are better.</p>
          </div>
        ),
      footer: (
        <div className="flex justify-end gap-2">
          <CustomButton text="Back" type="button" variant="secondary" onClick={() => store.prev()} />
          <CustomButton text="Continue" type="button" onClick={handleImagesNext} />
        </div>
      ),
    },
    {
      key: "summary",
      label: stepConfigMap.get("summary")?.label ?? "Summary",
      description: stepConfigMap.get("summary")?.description ?? "Review before saving",
      body: (
        <div className="space-y-3 text-sm text-smc-text">
          <div>
            <p>
              <strong>Name:</strong> {store.name}
            </p>
            <p>
              <strong>Plant:</strong> {plantsList.find((p) => p.id === store.plantId)?.name ?? "n/a"}
            </p>
            <p>
              <strong>Flows:</strong> {flowsList.filter((f) => store.flowIds.includes(f.id)).map((f) => f.slug).join(", ") || "n/a"}
            </p>
            <p>
              <strong>Price:</strong> {store.price}
            </p>
            <p>
              <strong>Images:</strong> {store.images.length + store.existingImages.length}
            </p>
          </div>

          {specType === "lanes" ? (
            <div>
              <p className="font-semibold text-smc-text">Lanes</p>
              {store.lanes.length === 0 ? (
                <p className="text-smc-text-muted">No lanes.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5">
                  {store.lanes.map((lane, idx) => (
                    <li key={idx}>
                      {lane.numberOfLanes} × {lane.lengthMm}×{lane.widthMm}×{lane.heightMm} mm · Level {lane.level} · {lane.laneType}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <p className="font-semibold text-smc-text">High-bay rack bays</p>
              {store.highBayBays.length === 0 ? (
                <p className="text-smc-text-muted">No bays.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5">
                  {store.highBayBays.map((bay, idx) => (
                    <li key={idx}>
                      Bay {idx + 1}: Levels {bay.numberOfLevels}, Slots {bay.numberOfSlots}, Slot {bay.slotLengthMm}×{bay.slotWidthMm}×{bay.slotHeightMm} mm
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <p className="font-semibold text-smc-text">Staffing</p>
            {store.staffingLines.length === 0 ? (
              <p className="text-smc-text-muted">No staffing lines.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                {store.staffingLines.map((line, idx) => (
                  <li key={idx}>
                    {line.role} · {line.shift.replace("_", " ")} · {line.workforceType.toLowerCase()} · Qty {line.qty}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-2">
          <CustomButton text="Back" type="button" variant="secondary" onClick={() => store.prev()} />
          <CustomButton
            text={pending ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            type="button"
            onClick={() => handleSubmit(new FormData())}
            disabled={pending}
          />
        </div>
      ),
    },
  ];

  return (
    <MeanMultistepForm
      steps={steps}
      currentIndex={store.step - 1}
      onStepChange={(s) => store.setStep((Math.min(6, Math.max(1, s + 1)) as 1 | 2 | 3 | 4 | 5 | 6))}
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      modeLabel={mode === "edit" ? "Update" : "Create"}
      onSubmit={handleSubmit}
    />
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold text-smc-text">{label}</label>
      <input
        className="mt-1 w-full rounded-md border border-smc-border px-3 py-2 text-sm"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
