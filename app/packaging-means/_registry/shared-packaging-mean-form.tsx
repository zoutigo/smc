"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type {
  Accessory,
  Flow,
  Image,
  PackagingMean,
  PackagingMeanAccessory,
  PackagingMeanCategory,
  PackagingMeanImage,
  PackagingMeanPart,
  Part,
  PartAccessory,
  PartFamily,
  Plant,
  Project,
  Supplier,
} from "@prisma/client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/custom-button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { MeanMultistepForm, type StepItem } from "@/components/forms/MeanMultistepForm";
import { NameInput } from "@/components/forms/NameInput";
import { DescriptionInput } from "@/components/forms/DescriptionInput";
import { PriceInput } from "@/components/forms/PriceInput";
import { SopInput } from "@/components/forms/SopInput";
import { PlantInput } from "@/components/forms/PlantInput";
import { FlowInput } from "@/components/forms/FlowInput";
import { SupplierInput } from "@/components/forms/SupplierInput";
import { ImageInput } from "@/components/forms/ImageInput";
import { AccessoryInput } from "@/components/forms/AccessoryInput";
import { PartFamilyInput } from "@/components/forms/PartFamilyInput";
import { ProjectInput } from "@/components/forms/ProjectInput";
import { basePackagingMeanSchema } from "./base-packaging-mean-schema";

type PackagingMeanImageWithUrl = PackagingMeanImage & { image: Image };
type PackagingMeanAccessoryWithAccessory = PackagingMeanAccessory & { accessory?: Accessory };
type PartAccessoryWithAccessory = PartAccessory & { accessory: Accessory };
type PackagingMeanPartWithRelations = PackagingMeanPart & {
  part: Part & {
    partFamily?: PartFamily | null;
    project?: Project | null;
    partAccessories?: PartAccessoryWithAccessory[] | null;
  };
};
export type PackagingMeanWithRelations = PackagingMean & {
  notes?: string | null;
  images: PackagingMeanImageWithUrl[];
  accessories: PackagingMeanAccessoryWithAccessory[];
  parts: PackagingMeanPartWithRelations[];
};

const accessorySchema = z.object({
  accessoryId: z.string().uuid(),
  qty: z.coerce.number().int().min(1).optional(),
});

const partAccessorySchema = z.object({
  accessoryId: z.string().uuid(),
  qtyPerPart: z.coerce.number().int().min(1).optional(),
});

const partSchema = z.object({
  name: z.string().min(2),
  projectId: z.string().uuid().optional().nullable(),
  partFamilyId: z.string().uuid(),
  partsPerPackaging: z.coerce.number().int().min(1).optional(),
  levelsPerPackaging: z.coerce.number().int().min(1).optional(),
  verticalPitch: z.coerce.number().int().min(0).optional(),
  horizontalPitch: z.coerce.number().int().min(0).optional(),
  accessories: z.array(partAccessorySchema).default([]),
  notes: z.string().optional(),
});

const formSchema = basePackagingMeanSchema.extend({
  description: z.string().optional(),
  numberOfPackagings: z.coerce.number().int().min(1),
  sop: z.string().optional(),
  notes: z.string().optional(),
  flowId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional().nullable()),
  supplierId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional().nullable()),
  images: z.array(z.instanceof(File)).default([]),
  existingImages: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
      })
    )
    .default([]),
  removedImageIds: z.array(z.string()).default([]),
  accessories: z.array(accessorySchema).default([]),
  parts: z.array(partSchema).default([]),
});

type FormValues = z.infer<typeof formSchema>;
type Step = 1 | 2 | 3 | 4 | 5;

type BasicsProps = {
  plants: Plant[];
  flows: Flow[];
  suppliers: Supplier[];
  countries: Array<{ id: string; name: string }>;
  accessories: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  partFamilies: Array<{ id: string; name: string }>;
};

type Props = BasicsProps & {
  mode: "create" | "edit";
  category: PackagingMeanCategory;
  packaging?: PackagingMeanWithRelations | null;
  onSubmit: (payload: FormData) => Promise<{ status: "idle" | "success" | "error"; fieldErrors?: Record<string, string>; message?: string; id?: string }>;
};

export function SharedPackagingMeanForm({
  mode,
  category,
  packaging,
  plants,
  flows,
  suppliers,
  countries,
  accessories,
  projects,
  partFamilies,
  onSubmit,
}: Props) {
  const router = useRouter();
  const { show } = useConfirmMessage();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<Step>(1);
  const [accessoryDraft, setAccessoryDraft] = useState<{ accessoryId: string; qty: number }>({ accessoryId: "", qty: 1 });
  const [familyList, setFamilyList] = useState(partFamilies);
  const [partDraft, setPartDraft] = useState<{
    name: string;
    projectId?: string;
    partFamilyId: string;
    partsPerPackaging?: number;
    levelsPerPackaging?: number;
    verticalPitch?: number;
    horizontalPitch?: number;
    accessories?: Array<{ accessoryId: string; qtyPerPart?: number }>;
    notes?: string;
  }>({
    name: "",
    projectId: undefined,
    partFamilyId: "",
    partsPerPackaging: 1,
    levelsPerPackaging: 1,
    verticalPitch: 0,
    horizontalPitch: 0,
    accessories: [],
    notes: "",
  });
  const [partAccessoryDraft, setPartAccessoryDraft] = useState<{ accessoryId: string; qty: number }>({ accessoryId: "", qty: 1 });
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: packaging?.name ?? "",
      description: packaging?.description ?? "",
      price: packaging?.price ?? 0,
      sop: packaging?.sop ? new Date(packaging.sop).toISOString().slice(0, 10) : "",
      width: packaging?.width ?? 0,
      length: packaging?.length ?? 0,
      height: packaging?.height ?? 0,
      numberOfPackagings: packaging?.numberOfPackagings ?? 1,
      plantId: packaging?.plantId ?? "",
      flowId: packaging?.flowId ?? "",
      supplierId: packaging?.supplierId ?? "",
      notes: packaging?.notes ?? "",
      images: [],
      existingImages: packaging?.images?.map((img) => ({ id: img.imageId, url: img.image.imageUrl })) ?? [],
      removedImageIds: [],
      accessories:
        packaging?.accessories?.map((a) => ({ accessoryId: a.accessoryId, qty: a.qtyPerPackaging ?? 1 })) ?? [],
      parts:
        packaging?.parts?.map((p) => ({
          name: p.part.name,
          projectId: p.part.projectId ?? undefined,
          partFamilyId: p.part.partFamilyId,
          partsPerPackaging: p.partsPerPackaging ?? 1,
          levelsPerPackaging: p.levelsPerPackaging ?? undefined,
          verticalPitch: p.verticalPitch ?? undefined,
          horizontalPitch: p.horizontalPitch ?? undefined,
          accessories:
            p.part.partAccessories?.map((pa) => ({
              accessoryId: pa.accessoryId,
              qtyPerPart: pa.qtyPerPart ?? 1,
            })) ?? [],
          notes: p.notes ?? "",
        })) ?? [],
    }),
    [packaging]
  );

  const familyOptions = useMemo(() => {
    const priorityNames = ["bumper", "tailgate"];
    const prioritized = familyList.filter((pf) => priorityNames.includes(pf.name.toLowerCase()));
    const rest = familyList.filter((pf) => !priorityNames.includes(pf.name.toLowerCase()));
    return [...prioritized, ...rest];
  }, [familyList]);

  const {
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const { fields: accessoryFields, append: appendAccessory, remove: removeAccessory } = useFieldArray({
    control,
    name: "accessories",
  });
  const { fields: partFields, append: appendPart, remove: removePart, update: updatePart } = useFieldArray({
    control,
    name: "parts",
  });

  const formValues = useWatch({ control }) as FormValues;

  useEffect(() => {
    reset(defaultValues);
    setStep(1);
    setFieldErrors({});
  }, [defaultValues, reset]);

  useEffect(() => {
    setFamilyList(partFamilies);
  }, [partFamilies]);

  const goToStep = (nextStep: Step, validateCurrent = false) => {
    if (validateCurrent && step === 2 && !basicsValid) return;
    setStep(nextStep);
  };

  const basicsValid =
    Boolean(formValues.name?.trim()) &&
    (formValues.name?.trim().length ?? 0) >= 2 &&
    Boolean(formValues.plantId) &&
    Number.isFinite(formValues.price) &&
    Number.isFinite(formValues.width) &&
    Number.isFinite(formValues.length) &&
    Number.isFinite(formValues.height) &&
    Number.isFinite(formValues.numberOfPackagings) &&
    (formValues.numberOfPackagings as number) >= 1;

  const addAccessory = () => {
    if (!accessoryDraft.accessoryId) return;
    appendAccessory({ accessoryId: accessoryDraft.accessoryId, qty: accessoryDraft.qty });
    setAccessoryDraft({ accessoryId: "", qty: 1 });
  };

  const resetPartDraft = () =>
    setPartDraft({
      name: "",
      projectId: undefined,
      partFamilyId: "",
      partsPerPackaging: 1,
      levelsPerPackaging: 1,
      verticalPitch: 0,
      horizontalPitch: 0,
      accessories: [],
      notes: "",
    });

  const addOrUpdatePart = () => {
    if (!partDraft.name || !partDraft.partFamilyId) return;
    const payload = {
      ...partDraft,
      projectId: partDraft.projectId || undefined,
      partsPerPackaging: partDraft.partsPerPackaging ?? 1,
      levelsPerPackaging: partDraft.levelsPerPackaging ?? 1,
      verticalPitch: partDraft.verticalPitch ?? 0,
      horizontalPitch: partDraft.horizontalPitch ?? 0,
      accessories: partDraft.accessories ?? [],
    };
    if (editingPartIndex !== null) {
      updatePart(editingPartIndex, payload);
    } else {
      appendPart(payload);
    }
    resetPartDraft();
    setPartAccessoryDraft({ accessoryId: "", qty: 1 });
    setEditingPartIndex(null);
  };

  const submitForm = () => {
    setFieldErrors({});
    startTransition(async () => {
      const parsed = formSchema.safeParse({
        ...formValues,
        accessories: formValues.accessories ?? [],
        parts: formValues.parts ?? [],
        images: formValues.images ?? [],
        existingImages: formValues.existingImages ?? [],
        removedImageIds: formValues.removedImageIds ?? [],
      });
      if (!parsed.success) {
        setFieldErrors({ basics: parsed.error.issues[0]?.message ?? "Invalid data" });
        setStep(2);
        return;
      }
      const values = parsed.data;
      const cleanedParts = (values.parts ?? []).filter((p) => p.name && p.partFamilyId);
      const cleanedAccessories = (values.accessories ?? []).filter((a) => a.accessoryId);
      const formData = new FormData();
      formData.set("categoryId", category.id);
      formData.set("categorySlug", category.slug);
      formData.set("name", values.name);
      formData.set("description", values.description ?? "");
      formData.set("price", String(values.price));
      formData.set("sop", values.sop ?? "");
      formData.set("width", String(values.width));
      formData.set("length", String(values.length));
      formData.set("height", String(values.height));
      formData.set("numberOfPackagings", String(values.numberOfPackagings));
      formData.set("plantId", values.plantId);
      if (values.flowId) formData.set("flowId", values.flowId);
      if (values.supplierId) formData.set("supplierId", values.supplierId);
      formData.set("notes", values.notes ?? "");
      formData.set("parts", JSON.stringify(cleanedParts));
      formData.set("accessories", JSON.stringify(cleanedAccessories));
      values.images.forEach((file, idx) => formData.append(`imageFile_${idx}`, file));
      formData.set("existingImages", JSON.stringify(values.existingImages));
      formData.set("removedImageIds", JSON.stringify(values.removedImageIds));
      if (packaging?.id) formData.set("id", packaging.id);

      const result = await onSubmit(formData);
      if (result.status === "success") {
        const destinationId = result.id ?? packaging?.id;
        show(mode === "create" ? "Packaging created" : "Packaging updated", "success");
        if (destinationId) {
          router.push(`/packaging-means/${category.slug}/${destinationId}`);
        } else {
          router.push(`/packaging-means/${category.slug}`);
        }
        return;
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result.message) show(result.message, "error");
      if (result.fieldErrors?.basics) setStep(2);
    });
  };

  const steps: StepItem[] = [
    {
      key: "preparation",
      label: "Preparation",
      description: "Checklist before starting",
      body: (
        <div className="space-y-3 rounded-xl border border-smc-border/70 bg-white p-4">
          <h3 className="font-semibold text-smc-text">Preparation checklist</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-smc-text-muted">
            <li>Basic details: name, description, SOP date, estimated price.</li>
            <li>Existing plant/flow to associate (or be ready to create them).</li>
            <li>Dimensions (L/W/H) and total packaging units.</li>
            <li>At least one representative image.</li>
          </ul>
          <div className="flex justify-end">
            <CustomButton
              text="Start"
              variant="secondary"
              size="default"
              onClick={() => goToStep(2)}
            />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Collect plant/flow info beforehand to speed up creation.</li>
            <li>Have dimensions ready to avoid guesswork.</li>
            <li>Choose high-quality images for better cards.</li>
          </ul>
        </div>
      ),
      footer: null,
    },
    {
      key: "basics",
      label: "Basics",
      description: "Core fields of the packaging mean",
      body: (
        <form
          className="space-y-4 rounded-xl border border-smc-border/70 bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            goToStep(3, true);
          }}
        >
          <div className="space-y-4">
            <NameInput
              value={formValues.name}
              onChange={(v) => setValue("name", v, { shouldDirty: true, shouldValidate: true })}
              error={errors.name?.message ?? fieldErrors.name}
            />
            <DescriptionInput
              value={formValues.description ?? ""}
              onChange={(v) => setValue("description", v, { shouldDirty: true, shouldValidate: true })}
              error={errors.description?.message ?? fieldErrors.description}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <PriceInput
                value={formValues.price}
                onChange={(v) => setValue("price", v, { shouldDirty: true, shouldValidate: true })}
                error={errors.price?.message ?? fieldErrors.price}
              />
              <SopInput
                value={formValues.sop ?? ""}
                onChange={(v) => setValue("sop", v, { shouldDirty: true, shouldValidate: true })}
                error={errors.sop?.message ?? fieldErrors.sop}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-smc-text">Length (mm)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                  value={formValues.length}
                  onChange={(e) => setValue("length", Number(e.target.value) || 0, { shouldValidate: true, shouldDirty: true })}
                  aria-label="Length"
                />
                {errors.length ? <p className="text-sm text-red-600">{errors.length.message}</p> : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-smc-text">Width (mm)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                  value={formValues.width}
                  onChange={(e) => setValue("width", Number(e.target.value) || 0, { shouldValidate: true, shouldDirty: true })}
                  aria-label="Width"
                />
                {errors.width ? <p className="text-sm text-red-600">{errors.width.message}</p> : null}
              </div>
              <div>
                <label className="block text-sm font-semibold text-smc-text">Height (mm)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                  value={formValues.height}
                  onChange={(e) => setValue("height", Number(e.target.value) || 0, { shouldValidate: true, shouldDirty: true })}
                  aria-label="Height"
                />
                {errors.height ? <p className="text-sm text-red-600">{errors.height.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-smc-text">Total packagings</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                  value={formValues.numberOfPackagings}
                  onChange={(e) =>
                    setValue("numberOfPackagings", Number(e.target.value) || 0, { shouldValidate: true, shouldDirty: true })
                  }
                  min={1}
                  aria-label="Total packagings"
                />
                {errors.numberOfPackagings ? <p className="text-sm text-red-600">{errors.numberOfPackagings.message}</p> : null}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-smc-text">Notes</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                value={formValues.notes ?? ""}
                onChange={(e) => setValue("notes", e.target.value, { shouldDirty: true, shouldValidate: true })}
                rows={3}
                placeholder="Additional remarks about this packaging"
              />
              {errors.notes ? <p className="text-sm text-red-600">{errors.notes.message}</p> : null}
            </div>
            <div className="space-y-1">
              <PlantInput
                value={formValues.plantId}
                onChange={(id) => setValue("plantId", id, { shouldDirty: true, shouldValidate: true })}
                plants={plants}
                countries={countries}
                required
              />
              {errors.plantId ? <p className="text-sm text-red-600">{errors.plantId.message}</p> : null}
            </div>
            <div className="space-y-1">
              <SupplierInput
                value={formValues.supplierId ?? ""}
                onChange={(id) => setValue("supplierId", id, { shouldDirty: true, shouldValidate: true })}
                suppliers={suppliers}
                countries={countries}
                label="Supplier (optional)"
              />
              {errors.supplierId ? <p className="text-sm text-red-600">{errors.supplierId.message}</p> : null}
            </div>
            <FlowInput
              value={formValues.flowId ?? ""}
              onChange={(id) => setValue("flowId", id, { shouldDirty: true, shouldValidate: true })}
              flows={flows}
            />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-smc-text">Accessories</h4>
              <div className="flex flex-wrap gap-3">
                {accessoryFields.map((a, idx) => {
                  const label = accessories.find((x) => x.id === a.accessoryId)?.name ?? "Accessory";
                  return (
                    <div key={`${a.accessoryId}-${idx}`} className="flex items-center gap-2 rounded-lg border border-smc-border/70 px-2 py-1 text-sm">
                      <span className="font-semibold text-smc-text">{label}</span>
                      <span className="text-sm text-smc-text-muted">qty {a.qty ?? 1}</span>
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeAccessory(idx);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <AccessoryInput
                  value={accessoryDraft.accessoryId}
                  onChange={(id) => setAccessoryDraft((d) => ({ ...d, accessoryId: id }))}
                  accessories={accessories}
                  plants={plants}
                  suppliers={suppliers}
                />
                <div>
                  <label className="block text-sm font-semibold text-smc-text">Accessory quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                    value={accessoryDraft.qty}
                    onChange={(e) => setAccessoryDraft((d) => ({ ...d, qty: Number(e.target.value) || 1 }))}
                    aria-label="Accessory quantity"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={addAccessory} disabled={!accessoryDraft.accessoryId}>
                  Add accessory
                </Button>
              </div>
            </div>
          </div>
          {fieldErrors["basics"] ? <p className="text-sm text-red-600">{fieldErrors["basics"]}</p> : null}
          <div className="flex justify-between">
            <CustomButton
              text="Previous"
              variant="outline"
              size="default"
              type="button"
              onClick={() => goToStep(1)}
            />
            <CustomButton
              text="Next"
              variant="secondary"
              size="default"
              type="submit"
              disabled={!basicsValid}
            />
          </div>
        </form>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Pick an existing plant or create one inline if missing.</li>
            <li>Provide realistic dimensions.</li>
            <li>Use concise names and descriptions.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "parts",
      label: "Parts",
      description: "Associate parts with this packaging",
      body: (
        <div className="rounded-xl border border-smc-border/70 bg-white p-4 space-y-4">
          <div className="rounded-lg border border-smc-border/70 bg-smc-bg/50 p-4 shadow-inner">
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-smc-text">Part name</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                    value={partDraft.name}
                    onChange={(e) => setPartDraft((d) => ({ ...d, name: e.target.value }))}
                    aria-label="Part name"
                    placeholder="e.g. Front bumper"
                  />
                </div>
                <div>
                  <PartFamilyInput
                    value={partDraft.partFamilyId ?? ""}
                    onChange={(id) => setPartDraft((d) => ({ ...d, partFamilyId: id }))}
                    families={familyOptions}
                    onCreated={(family) => setFamilyList((prev) => [...prev, family])}
                  />
                </div>
                <div>
                  <ProjectInput
                    value={partDraft.projectId ?? ""}
                    onChange={(id) => setPartDraft((d) => ({ ...d, projectId: id || undefined }))}
                    projects={projects}
                    label="Project"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-semibold text-smc-text">Parts / packaging</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                      value={partDraft.partsPerPackaging ?? 1}
                      min={1}
                      onChange={(e) => setPartDraft((d) => ({ ...d, partsPerPackaging: Number(e.target.value) || 1 }))}
                      aria-label="Parts per packaging"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-smc-text">Levels / packaging</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                      value={partDraft.levelsPerPackaging ?? 1}
                      min={1}
                      onChange={(e) => setPartDraft((d) => ({ ...d, levelsPerPackaging: Number(e.target.value) || 1 }))}
                      aria-label="Levels per packaging"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-smc-text">Vertical pitch</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                      value={partDraft.verticalPitch ?? 0}
                      min={0}
                      onChange={(e) => setPartDraft((d) => ({ ...d, verticalPitch: Number(e.target.value) || 0 }))}
                      aria-label="Vertical pitch"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-smc-text">Horizontal pitch</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                      value={partDraft.horizontalPitch ?? 0}
                      min={0}
                      onChange={(e) => setPartDraft((d) => ({ ...d, horizontalPitch: Number(e.target.value) || 0 }))}
                      aria-label="Horizontal pitch"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-smc-text">Notes</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                    value={partDraft.notes ?? ""}
                    onChange={(e) => setPartDraft((d) => ({ ...d, notes: e.target.value }))}
                    rows={3}
                    aria-label="Part notes"
                    placeholder="Assembly hints, handling constraints…"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-smc-text">Part accessories</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!partAccessoryDraft.accessoryId) return;
                        setPartDraft((d) => ({
                          ...d,
                          accessories: [...(d.accessories ?? []), { accessoryId: partAccessoryDraft.accessoryId, qtyPerPart: partAccessoryDraft.qty }],
                        }));
                        setPartAccessoryDraft({ accessoryId: "", qty: 1 });
                      }}
                      disabled={!partAccessoryDraft.accessoryId}
                    >
                      Add accessory
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
                    <AccessoryInput
                      value={partAccessoryDraft.accessoryId}
                      onChange={(id) => setPartAccessoryDraft((d) => ({ ...d, accessoryId: id }))}
                      accessories={accessories}
                      plants={plants}
                      suppliers={suppliers}
                      label="Accessory"
                    />
                    <div>
                      <label className="block text-sm font-semibold text-smc-text">Qty per part</label>
                      <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
                        value={partAccessoryDraft.qty}
                        onChange={(e) => setPartAccessoryDraft((d) => ({ ...d, qty: Number(e.target.value) || 1 }))}
                        aria-label="Qty per part"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(partDraft.accessories ?? []).map((acc, idx) => {
                      const label = accessories.find((a) => a.id === acc.accessoryId)?.name ?? "Accessory";
                      return (
                        <div key={`${acc.accessoryId}-${idx}`} className="flex items-center gap-2 rounded-lg border border-smc-border/70 px-2 py-1 text-xs">
                          <span className="font-semibold text-smc-text">{label}</span>
                          <span className="text-sm text-smc-text-muted">qty {acc.qtyPerPart ?? 1}</span>
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPartDraft((d) => ({
                                ...d,
                                accessories: (d.accessories ?? []).filter((_, i) => i !== idx),
                              }));
                            }}
                            aria-label={`Remove accessory ${label}`}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="space-y-3 rounded-lg border border-dashed border-smc-border/70 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-smc-text">{editingPartIndex !== null ? "Edit part" : "New part preview"}</p>
                    <div className="flex items-center gap-2">
                      {editingPartIndex !== null ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            resetPartDraft();
                            setEditingPartIndex(null);
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOrUpdatePart}
                        disabled={!partDraft.name || !partDraft.partFamilyId}
                      >
                        {editingPartIndex !== null ? "Save part" : "Add part"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-smc-text-muted">
                    <p><span className="font-semibold text-smc-text">Name:</span> {partDraft.name || "—"}</p>
                    <p><span className="font-semibold text-smc-text">Family:</span> {familyList.find((pf) => pf.id === partDraft.partFamilyId)?.name ?? "—"}</p>
                    <p><span className="font-semibold text-smc-text">Project:</span> {projects.find((p) => p.id === partDraft.projectId)?.name ?? "—"}</p>
                    <p><span className="font-semibold text-smc-text">Qty:</span> {partDraft.partsPerPackaging ?? 1} pcs · Levels {partDraft.levelsPerPackaging ?? 1} · V {partDraft.verticalPitch ?? 0} · H {partDraft.horizontalPitch ?? 0}</p>
                    <p className="text-sm text-smc-text-muted">
                      Accessories: {(partDraft.accessories ?? []).length
                        ? (partDraft.accessories ?? [])
                            .map((acc) => accessories.find((a) => a.id === acc.accessoryId)?.name ?? "Accessory")
                            .join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-smc-border/70 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-smc-text">Added parts</p>
                    <span className="text-xs text-smc-text-muted">{partFields.length} item{partFields.length === 1 ? "" : "s"}</span>
                  </div>
                  {partFields.length ? (
                    <div className="flex flex-col gap-2">
                      {partFields.map((p, idx) => (
                        <div
                          key={`${p.name}-${idx}`}
                          className="flex w-full items-start justify-between gap-3 rounded-lg border border-smc-border/70 bg-smc-bg/70 px-3 py-2 text-left text-xs text-smc-text shadow-sm cursor-pointer"
                          onClick={() => {
                            const { id: _id, ...rest } = p;
                            void _id;
                            setPartDraft({
                              ...rest,
                              projectId: rest.projectId || undefined,
                              partFamilyId: rest.partFamilyId ?? "",
                              partsPerPackaging: rest.partsPerPackaging ?? 1,
                              levelsPerPackaging: rest.levelsPerPackaging ?? 1,
                              verticalPitch: rest.verticalPitch ?? 0,
                              horizontalPitch: rest.horizontalPitch ?? 0,
                              accessories: rest.accessories ?? [],
                              notes: rest.notes ?? "",
                            });
                            setEditingPartIndex(idx);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              const { id: _id, ...rest } = p;
                              void _id;
                              setPartDraft({
                                ...rest,
                                projectId: rest.projectId || undefined,
                                partFamilyId: rest.partFamilyId ?? "",
                                partsPerPackaging: rest.partsPerPackaging ?? 1,
                                levelsPerPackaging: rest.levelsPerPackaging ?? 1,
                                verticalPitch: rest.verticalPitch ?? 0,
                                horizontalPitch: rest.horizontalPitch ?? 0,
                                accessories: rest.accessories ?? [],
                                notes: rest.notes ?? "",
                              });
                              setEditingPartIndex(idx);
                            }
                          }}
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-smc-text">{p.name || "Part"}</p>
                            <p className="text-sm text-smc-text-muted">
                              {p.partsPerPackaging ?? 1} pcs · {familyList.find((pf) => pf.id === p.partFamilyId)?.name ?? "Family"} · Levels {p.levelsPerPackaging ?? 1} {p.projectId ? `· ${projects.find((pr) => pr.id === p.projectId)?.name ?? ""}` : ""}
                            </p>
                            <p className="text-xs text-smc-text-muted">
                              Accessories: {p.accessories?.length ? p.accessories.map((acc) => accessories.find((a) => a.id === acc.accessoryId)?.name ?? "Accessory").join(", ") : "None"}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removePart(idx);
                              if (editingPartIndex === idx) {
                                resetPartDraft();
                                setEditingPartIndex(null);
                              }
                            }}
                            aria-label={`Remove part ${p.name || idx + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-smc-text-muted">No parts added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {errors.parts ? <p className="text-sm text-red-600">{errors.parts.message as string}</p> : null}
          <div className="flex justify-between">
            <CustomButton
              text="Previous"
              variant="outline"
              size="default"
              onClick={() => goToStep(2)}
            />
            <CustomButton
              text="Next"
              variant="secondary"
              size="default"
              onClick={() => goToStep(4, true)}
            />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Ensure each part has a family and project if applicable.</li>
            <li>Use realistic pitches to reflect spacing.</li>
            <li>Add only the necessary parts for this packaging.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "images",
      label: "Images",
      description: "Upload visuals",
      body: (
        <div className="rounded-xl border border-smc-border/70 bg-white p-4">
          <ImageInput
            files={formValues.images}
            onChange={(files) => setValue("images", files, { shouldDirty: true, shouldValidate: true })}
            existingImages={formValues.existingImages}
            onRemoveExisting={(id) => {
              setValue(
                "existingImages",
                formValues.existingImages.filter((img) => img.id !== id),
                { shouldDirty: true, shouldValidate: true }
              );
              setValue("removedImageIds", [...formValues.removedImageIds, id], { shouldDirty: true, shouldValidate: true });
            }}
            error={errors.images?.message ?? fieldErrors.images}
          />
          <div className="mt-4 flex justify-between">
            <CustomButton
              text="Previous"
              variant="outline"
              size="default"
              onClick={() => goToStep(3)}
            />
            <CustomButton
              text="Next"
              variant="secondary"
              size="default"
              onClick={() => goToStep(5, true)}
            />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Add at least one representative image.</li>
            <li>Prefer jpg/png for faster previews.</li>
            <li>Ensure you own rights to the selected images.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "summary",
      label: "Summary",
      description: "Review and confirm",
      body: (
        <div className="space-y-4 rounded-xl border border-smc-border/70 bg-white p-4">
                <div className="space-y-2 rounded-xl border border-smc-border/80 bg-white p-4">
                  <p className="text-sm text-smc-text-muted">Review before submit.</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold text-smc-text">Name</h4>
                <p className="text-sm text-smc-text-muted">{formValues.name || "—"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-smc-text">Dimensions (L×W×H mm)</h4>
                <p className="text-sm text-smc-text-muted">
                  {formValues.length} × {formValues.width} × {formValues.height}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-smc-text">Plant</h4>
                <p className="text-sm text-smc-text-muted">
                  {plants.find((p) => p.id === formValues.plantId)?.name ?? "—"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-smc-text">Flow</h4>
                <p className="text-sm text-smc-text-muted">
                  {flows.find((f) => f.id === formValues.flowId)?.slug ?? "—"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-smc-text">Images</h4>
              <p className="text-sm text-smc-text-muted">
                {(formValues.images?.length ?? 0) + (formValues.existingImages?.length ?? 0)} file(s)
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-smc-text">Accessories</h4>
              <p className="text-sm text-smc-text-muted">
                {formValues.accessories.length
                  ? formValues.accessories
                      .map((a) => accessories.find((x) => x.id === a.accessoryId)?.name ?? "Accessory")
                      .join(", ")
                  : "None"}
              </p>
            </div>
                <div>
                  <h4 className="font-semibold text-smc-text">Parts</h4>
                  <p className="text-sm text-smc-text-muted">
                    {formValues.parts.length
                      ? formValues.parts
                          .map((p) => {
                            const fam = familyList.find((f) => f.id === p.partFamilyId)?.name;
                            return fam
                              ? `${p.name || "Part"} (${fam}, ${p.partsPerPackaging ?? 1} pcs, levels ${p.levelsPerPackaging ?? 1}, accessories ${
                                  p.accessories?.length
                                    ? p.accessories
                                        .map((acc) => accessories.find((a) => a.id === acc.accessoryId)?.name ?? "Accessory")
                                        .join(", ")
                                    : "None"
                                })`
                              : `${p.name || "Part"} (${p.partsPerPackaging ?? 1} pcs, levels ${p.levelsPerPackaging ?? 1}, accessories ${
                                  p.accessories?.length
                                    ? p.accessories
                                        .map((acc) => accessories.find((a) => a.id === acc.accessoryId)?.name ?? "Accessory")
                                        .join(", ")
                                    : "None"
                                })`;
                          })
                          .join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
              <div className="flex justify-between">
            <CustomButton
              text="Previous"
              variant="outline"
              size="default"
              onClick={() => goToStep(4)}
            />
            <CustomButton
              text={mode === "create" ? "Create" : "Update"}
              variant="secondary"
              size="default"
              disabled={isPending}
              onClick={submitForm}
            />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Double-check dimensions and packagings count.</li>
            <li>Ensure plant/flow are correct; go back if needed.</li>
            <li>Confirm at least one image is present.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <MeanMultistepForm
      heroTitle={mode === "create" ? "Create packaging" : "Update packaging"}
      heroSubtitle={`Follow the steps to configure the ${category.name.toLowerCase()} packaging.`}
      modeLabel={mode === "create" ? "Create" : "Edit mode"}
      steps={steps}
      currentIndex={step - 1}
    />
  );
}
