"use client";

import { useTransition, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomButton } from "@/components/ui/custom-button";
import { MeanMultistepForm, type StepItem } from "@/components/forms/MeanMultistepForm";
import { ImageInput } from "@/components/forms/ImageInput";
import { SupplierInput } from "@/components/forms/SupplierInput";
import { PlantInput } from "@/components/forms/PlantInput";
import { FlowMultiInput } from "@/components/forms/FlowMultiInput";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { baseTransportMeanSchema } from "./base-transport-mean-schema";

type PackagingMeanOption = { id: string; name: string; plantId?: string | null };
type SupplierOption = { id: string; name: string };
type PlantOption = { id: string; name: string };
type CountryOption = { id: string; name: string };
type FlowOption = { id: string; from: string; to: string; slug: string };
type TransportMeanDefaults = {
  id: string;
  name: string;
  description?: string | null;
  supplierId?: string | null;
  plantId: string;
  units?: number | null;
  loadCapacityKg?: number | null;
  cruiseSpeedKmh?: number | null;
  maxSpeedKmh?: number | null;
  sop?: Date | string | null;
  eop?: Date | string | null;
  packagingLinks?: Array<{ packagingMeanId: string; maxQty: number }>;
  flows?: Array<{ flowId: string }>;
};

const formSchema = baseTransportMeanSchema.extend({
  supplierId: z.preprocess((val) => (typeof val === "string" && val.length ? val : undefined), z.string().uuid().optional()),
  packagingLinks: z
    .array(
      z.object({
        packagingMeanId: z.string().uuid(),
        maxQty: z.coerce.number().int().min(1).default(1),
      })
    )
    .default([]),
  images: z.array(z.instanceof(File)).default([]),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  categoryId: string;
  categoryName: string;
  mode: "create" | "edit";
  suppliers: SupplierOption[];
  plants: PlantOption[];
  flows: FlowOption[];
  countries?: CountryOption[];
  packagingMeans: PackagingMeanOption[];
  transport?: TransportMeanDefaults | null;
  redirectTo: string;
  onSubmit: (payload: FormData) => Promise<{ status: "idle" | "success" | "error"; fieldErrors?: Record<string, string>; id?: string }>;
};

export function TransportMeanForm({ categoryId, categoryName, mode, suppliers, plants, flows, countries, packagingMeans, transport, redirectTo, onSubmit }: Props) {
  const router = useRouter();
  const { show } = useConfirmMessage();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [plantOptions, setPlantOptions] = useState(plants);
  const [supplierOptions, setSupplierOptions] = useState(suppliers);
  const [flowOptions, setFlowOptions] = useState(flows);
  const countryOptions = countries ?? [];
  const formatDate = (value?: Date | string | null) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const initialValues = useMemo(
    () => ({
      transportMeanCategoryId: categoryId,
      name: transport?.name ?? "",
      description: transport?.description ?? "",
      supplierId: transport?.supplierId ?? undefined,
      plantId: transport?.plantId ?? "",
      flowIds: transport?.flows?.map((flow) => flow.flowId) ?? [],
      packagingLinks: transport?.packagingLinks ?? [],
      units: transport?.units ?? 1,
      loadCapacityKg: transport?.loadCapacityKg ?? 0,
      cruiseSpeedKmh: transport?.cruiseSpeedKmh ?? 0,
      maxSpeedKmh: transport?.maxSpeedKmh ?? 0,
      sop: formatDate(transport?.sop),
      eop: formatDate(transport?.eop),
    }),
    [categoryId, transport]
  );

  const {
    register,
    setValue,
    trigger,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: initialValues,
    shouldUnregister: false,
  });

  const formValues = useWatch({ control }) as FormValues;

  const packagingLinks = formValues.packagingLinks;
  const selectedPlantId = formValues.plantId;

  const filteredPackagingMeans = useMemo(
    () =>
      packagingMeans.filter((pm) => {
        if (!selectedPlantId) return true;
        return !pm.plantId || pm.plantId === selectedPlantId;
      }),
    [packagingMeans, selectedPlantId]
  );

  useEffect(() => {
    if (!selectedPlantId) return;
    const filteredLinks = (packagingLinks ?? []).filter((link) => {
      const pm = packagingMeans.find((p) => p.id === link.packagingMeanId);
      return pm ? !pm.plantId || pm.plantId === selectedPlantId : false;
    });
    if (filteredLinks.length !== (packagingLinks ?? []).length) {
      setValue("packagingLinks", filteredLinks, { shouldValidate: true });
    }
  }, [selectedPlantId, packagingLinks, packagingMeans, setValue]);

  useEffect(() => {
    reset(initialValues);
    setStepIndex(0);
    setFieldErrors({});
  }, [initialValues, reset]);

  useEffect(() => {
    setPlantOptions(plants);
  }, [plants]);

  useEffect(() => {
    setSupplierOptions(suppliers);
  }, [suppliers]);

  useEffect(() => {
    setFlowOptions(flows);
  }, [flows]);

  const goNext = () => setStepIndex((idx) => Math.min(idx + 1, 4));
  const goPrev = () => setStepIndex((idx) => Math.max(idx - 1, 0));

  const submitForm = () => {
    setFieldErrors({});
    startTransition(async () => {
      const parsed = formSchema.safeParse({
        ...formValues,
        flowIds: formValues.flowIds ?? [],
        packagingLinks: formValues.packagingLinks ?? [],
        images,
      });

      if (!parsed.success) {
        const nextErrors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const key = issue.path[0];
          if (typeof key === "string" && !nextErrors[key]) {
            nextErrors[key] = issue.message;
          }
        });
        setFieldErrors(nextErrors);
        setStepIndex(1);
        return;
      }

      const values = parsed.data;
      const fd = new FormData();
      fd.append("transportMeanCategoryId", values.transportMeanCategoryId);
      fd.append("name", values.name);
      if (values.description) fd.append("description", values.description);
      if (values.supplierId ?? "") fd.append("supplierId", values.supplierId as string);
      fd.append("units", String(values.units ?? 1));
      fd.append("loadCapacityKg", String(values.loadCapacityKg ?? 0));
      fd.append("cruiseSpeedKmh", String(values.cruiseSpeedKmh ?? 0));
      fd.append("maxSpeedKmh", String(values.maxSpeedKmh ?? 0));
      if (values.sop) fd.append("sop", values.sop);
      if (values.eop) fd.append("eop", values.eop);
      if (values.flowIds?.length) fd.append("flowIds", JSON.stringify(values.flowIds));
      fd.append("packagingLinks", JSON.stringify(values.packagingLinks ?? []));
      images.forEach((file, idx) => fd.append(`imageFile_${idx}`, file));
      fd.append("plantId", values.plantId);

      const res = await onSubmit(fd);
      if (res.status === "success") {
        show("Transport mean saved", "success");
        const target = res.id ? `${redirectTo}/${res.id}` : redirectTo;
        router.push(target);
        return;
      }
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      if (res.fieldErrors) setStepIndex(1);
    });
  };

  const handleBasicsNext = async () => {
    const valid = await trigger(["name", "plantId", "transportMeanCategoryId", "units", "loadCapacityKg", "cruiseSpeedKmh", "maxSpeedKmh"]);
    if (valid) goNext();
  };

  const basicsSection = (
      <div className="rounded-lg border border-smc-border/70 bg-white p-4 shadow-inner space-y-3">
        <div>
          <label className="block text-sm font-semibold text-smc-text" htmlFor="tm-name">
            Name
          </label>
          <input id="tm-name" className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2" placeholder="Transport mean name" {...register("name")} />
          {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          {fieldErrors.name ? <p className="text-sm text-red-600">{fieldErrors.name}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-semibold text-smc-text" htmlFor="tm-description">
            Description
          </label>
          <textarea id="tm-description" className="mt-1 w-full resize-none rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2" rows={3} placeholder="What makes this transport mean unique?" {...register("description")} />
          {errors.description ? <p className="text-sm text-red-600">{errors.description.message}</p> : null}
        </div>
        <div className="space-y-2">
          <SupplierInput
            value={formValues.supplierId ?? ""}
            onChange={(id) => setValue("supplierId", id, { shouldValidate: true, shouldDirty: true })}
            suppliers={supplierOptions}
            countries={countryOptions}
            required={false}
            onCreated={(supplier) => setSupplierOptions((prev) => [...prev, supplier])}
          />
          {errors.supplierId ? <p className="text-xs text-red-600">{errors.supplierId.message}</p> : null}
          {fieldErrors.supplierId ? <p className="text-xs text-red-600">{fieldErrors.supplierId}</p> : null}
        </div>
        <div className="space-y-2">
          <PlantInput
            value={formValues.plantId ?? ""}
            onChange={(id) => setValue("plantId", id, { shouldValidate: true, shouldDirty: true })}
            plants={plantOptions}
            countries={countryOptions}
            required
            onCreated={(plant) => setPlantOptions((prev) => [...prev, plant])}
          />
          {errors.plantId ? <p className="text-xs text-red-600">{errors.plantId.message}</p> : null}
          {fieldErrors.plantId ? <p className="text-xs text-red-600">{fieldErrors.plantId}</p> : null}
        </div>
        <FlowMultiInput
          value={formValues.flowIds ?? []}
          onChange={(ids) => setValue("flowIds", ids, { shouldValidate: true, shouldDirty: true })}
          flows={flowOptions}
          label="Flows"
          onCreated={(flow) => setFlowOptions((prev) => [...prev, flow])}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-smc-text" htmlFor="tm-units">
              Units
            </label>
            <input id="tm-units" type="number" className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm" {...register("units", { valueAsNumber: true })} />
            {errors.units ? <p className="text-xs text-red-600">{errors.units.message}</p> : null}
            {fieldErrors.units ? <p className="text-xs text-red-600">{fieldErrors.units}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold text-smc-text" htmlFor="tm-load-capacity">
              Load capacity (kg)
            </label>
            <input id="tm-load-capacity" type="number" className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm" {...register("loadCapacityKg", { valueAsNumber: true })} />
            {errors.loadCapacityKg ? <p className="text-xs text-red-600">{errors.loadCapacityKg.message}</p> : null}
            {fieldErrors.loadCapacityKg ? <p className="text-xs text-red-600">{fieldErrors.loadCapacityKg}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold text-smc-text" htmlFor="tm-cruise-speed">
              Cruise speed (km/h)
            </label>
            <input id="tm-cruise-speed" type="number" className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm" {...register("cruiseSpeedKmh", { valueAsNumber: true })} />
            {errors.cruiseSpeedKmh ? <p className="text-xs text-red-600">{errors.cruiseSpeedKmh.message}</p> : null}
            {fieldErrors.cruiseSpeedKmh ? <p className="text-xs text-red-600">{fieldErrors.cruiseSpeedKmh}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold text-smc-text" htmlFor="tm-max-speed">
              Max speed (km/h)
            </label>
            <input id="tm-max-speed" type="number" className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm" {...register("maxSpeedKmh", { valueAsNumber: true })} />
            {errors.maxSpeedKmh ? <p className="text-xs text-red-600">{errors.maxSpeedKmh.message}</p> : null}
            {fieldErrors.maxSpeedKmh ? <p className="text-xs text-red-600">{fieldErrors.maxSpeedKmh}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold text-smc-text" htmlFor="tm-sop">
              SOP
            </label>
            <input id="tm-sop" type="date" className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm" {...register("sop")} />
          </div>
          <div>
            <label className="text-xs font-semibold text-smc-text" htmlFor="tm-eop">
              EOP
            </label>
            <input id="tm-eop" type="date" className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm" {...register("eop")} />
          </div>
        </div>
      </div>
  );

  const packagingSection = (
      <div className="rounded-lg border border-smc-border/70 bg-white p-4 shadow-inner space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-smc-text">Packaging means</h3>
          <span className="text-xs text-smc-text-muted">{packagingLinks?.length ?? 0} selected</span>
        </div>
        <div className="space-y-2">
          {filteredPackagingMeans.map((pm) => {
            const existing = packagingLinks?.find((l) => l.packagingMeanId === pm.id);
            return (
              <div key={pm.id} className="flex items-center gap-2 rounded-md border border-smc-border/60 p-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-smc-text">{pm.name}</p>
                </div>
                <input
                  aria-label={`Max qty for ${pm.name}`}
                  type="number"
                  min={1}
                  className="w-24 rounded-md border border-smc-border/70 px-2 py-1 text-sm"
                  value={existing?.maxQty ?? ""}
                  placeholder="Max qty"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setValue(
                      "packagingLinks",
                      [
                        ...(packagingLinks ?? []).filter((l) => l.packagingMeanId !== pm.id),
                        ...(isNaN(val) || val <= 0 ? [] : [{ packagingMeanId: pm.id, maxQty: val }]),
                      ],
                      { shouldValidate: true }
                    );
                  }}
                />
              </div>
            );
          })}
          {filteredPackagingMeans.length === 0 ? (
            <p className="text-sm text-smc-text-muted">No packaging means available for the selected plant.</p>
          ) : null}
        </div>
      </div>
  );

  const summary = (
    <div className="rounded-lg border border-dashed border-smc-border/70 bg-smc-bg/50 p-4 text-sm text-smc-text space-y-2">
      <p className="font-semibold text-smc-text">Summary</p>
      <p className="text-sm text-smc-text-muted">
        This recap mirrors every value you entered. Verify the operational context, capacities, links, and images before saving.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-smc-text-muted">
        <li>Confirm the plant, supplier, and flow(s) match the real deployment site.</li>
        <li>Double-check units and capacity metrics to avoid incorrect logistics planning.</li>
        <li>Ensure packaging links and max quantities reflect actual transport limits.</li>
        <li>Verify the SOP/EOP timeline to keep lifecycle data accurate.</li>
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Name</p>
          <p className="font-semibold text-smc-text">{formValues.name || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Description</p>
          <p className="font-semibold text-smc-text">{formValues.description || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Plant</p>
          <p className="font-semibold text-smc-text">{plantOptions.find((p) => p.id === formValues.plantId)?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Supplier</p>
          <p className="font-semibold text-smc-text">{supplierOptions.find((s) => s.id === formValues.supplierId)?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Flows</p>
          <p className="font-semibold text-smc-text">
            {formValues.flowIds?.length
              ? formValues.flowIds
                .map((id) => flowOptions.find((flow) => flow.id === id))
                  .filter(Boolean)
                  .map((flow) => `${flow?.from} → ${flow?.to}`)
                  .join(", ")
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Units</p>
          <p className="font-semibold text-smc-text">{formValues.units ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">SOP</p>
          <p className="font-semibold text-smc-text">{formValues.sop || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">EOP</p>
          <p className="font-semibold text-smc-text">{formValues.eop || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Load capacity (kg)</p>
          <p className="font-semibold text-smc-text">{formValues.loadCapacityKg ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Cruise speed</p>
          <p className="font-semibold text-smc-text">{formValues.cruiseSpeedKmh ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Max speed</p>
          <p className="font-semibold text-smc-text">{formValues.maxSpeedKmh ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Packaging links</p>
          <p className="font-semibold text-smc-text">{packagingLinks?.length ?? 0} linked</p>
        </div>
        <div>
          <p className="text-xs uppercase text-smc-text-muted">Images</p>
          <p className="font-semibold text-smc-text">{images.length} selected</p>
        </div>
      </div>
    </div>
  );

  const steps: StepItem[] = [
    {
      key: "prep",
      label: "Preparation",
      description: "Get ready to register a transport mean",
      body: (
        <div className="space-y-3 rounded-lg border border-smc-border/70 bg-white p-4 shadow-inner">
          <p className="text-sm text-smc-text">
            Outline the transport equipment you want to add. You will fill basics, link packaging means, attach images, then confirm.
          </p>
          <div className="flex justify-end">
            <CustomButton text="Start" type="button" onClick={goNext} />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Collect supplier and plant context to avoid mismatched deployments.</li>
            <li>Have capacity, speed, and unit details ready to speed through Basics.</li>
            <li>List required packaging means and max quantities ahead of time.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "basics",
      label: "Basics",
      description: "Fill the transport mean details",
      body: (
        <div className="space-y-4">
          {basicsSection}
          <div className="flex justify-between">
            <CustomButton text="Back" type="button" variant="outline" onClick={goPrev} />
            <CustomButton text="Next" type="button" onClick={handleBasicsNext} disabled={!isValid} />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Use a clear, unique name so the transport mean is easy to search.</li>
            <li>Select the right plant and supplier to keep sourcing accurate.</li>
            <li>Choose every relevant flow to reflect all operational routes.</li>
            <li>Validate units, load capacity, and speed numbers with real specs.</li>
            <li>Set SOP/EOP dates to reflect production lifecycle planning.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "packaging",
      label: "Packaging",
      description: "Link packaging means",
      body: (
        <div className="space-y-4">
          {packagingSection}
          <div className="flex justify-between">
            <CustomButton text="Back" type="button" variant="outline" onClick={goPrev} />
            <CustomButton text="Next" type="button" onClick={goNext} />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Only link packaging means that this transport mean can actually carry.</li>
            <li>Set max quantity per packaging mean to match real capacity limits.</li>
            <li>Filter by plant to avoid linking items from the wrong site.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "images",
      label: "Images",
      description: "Add visuals",
      body: (
        <div className="space-y-4">
          <div className="rounded-lg border border-smc-border/70 bg-white p-4 shadow-inner">
            <ImageInput label="Images" files={images} onChange={setImages} />
          </div>
          <div className="flex justify-between">
            <CustomButton text="Back" type="button" variant="outline" onClick={goPrev} />
            <CustomButton text="Next" type="button" onClick={goNext} />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Add clear photos that help distinguish the equipment quickly.</li>
            <li>Prefer front/side views showing size and key components.</li>
            <li>Multiple images are supported if you need more detail.</li>
          </ul>
        </div>
      ),
    },
    {
      key: "summary",
      label: "Summary",
      description: "Review before saving",
      body: (
        <div className="space-y-4">
          {summary}
          <div className="flex justify-between">
            <CustomButton text="Back" type="button" variant="outline" onClick={goPrev} />
            <CustomButton text={mode === "create" ? "Create" : "Update"} type="button" disabled={isPending} onClick={submitForm} />
          </div>
        </div>
      ),
      guidance: (
        <div>
          <h3 className="text-sm font-semibold text-smc-text">Guidance</h3>
          <ul className="mt-2 space-y-1 text-sm text-smc-text-muted">
            <li>Scan the recap for missing or inconsistent values.</li>
            <li>Check that linked packaging means and quantities align with specs.</li>
            <li>Verify image count matches what you intended to upload.</li>
            <li>Save only after confirming all operational data is correct.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <MeanMultistepForm
        heroTitle={mode === "create" ? "Create transport mean" : "Update transport mean"}
        heroSubtitle={`Follow the steps to configure the ${categoryName.toLowerCase()} transport mean.`}
        modeLabel={mode === "create" ? "Create" : "Edit mode"}
        steps={steps}
        currentIndex={stepIndex}
      />
    </form>
  );
}
