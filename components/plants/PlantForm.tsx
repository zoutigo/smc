"use client";

import React, { useEffect, startTransition, useRef, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
// simple debounce helper (avoid extra dependency)
function debounceFn(fn: (...args: unknown[]) => unknown, wait = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => (fn as (...a: unknown[]) => unknown)(...args), wait);
  };
}

import { createPlantSchema, CreatePlantInput } from "@/app/plants/schema";
import { createPlantAction, type PlantState } from "@/app/plants/actions";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";

const countries = ["France", "United Kingdom", "United States", "Germany", "Spain", "Italy", "Netherlands", "Belgium", "Portugal", "Poland", "Austria", "Switzerland", "Sweden", "Norway", "Denmark", "Finland", "Ireland", "Canada"];
type FormValues = {
  plantName: string;
  address?: string;
  city: string;
  zipcode?: string;
  country: string;
  image?: string;
  imageFile?: FileList;
};

type PlantFormInitialValues = Partial<FormValues> & { id?: string };

interface PlantFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  actionOverride?: (fd: FormData) => Promise<unknown>;
  debounceMs?: number;
  initialValues?: PlantFormInitialValues;
  mode?: "create" | "edit";
  submitLabel?: string;
  successMessage?: string;
}

export default function PlantForm({
  onClose,
  onSuccess,
  actionOverride,
  debounceMs,
  initialValues,
  mode = "create",
  submitLabel,
  successMessage,
}: PlantFormProps) {
  const initialState: PlantState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    createPlantAction as unknown as (s: PlantState, fd: FormData) => Promise<PlantState>,
    initialState,
  );
  const { show } = useConfirmMessage();

  const normalizedDefaults = useMemo(() => ({
    plantName: initialValues?.plantName ?? "",
    address: initialValues?.address ?? "",
    city: initialValues?.city ?? "",
    zipcode: initialValues?.zipcode ?? "",
    country: initialValues?.country ?? "",
    image: initialValues?.image ?? undefined,
  }), [initialValues]);

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, setError, reset, watch, resetField } = useForm<FormValues>({
    resolver: zodResolver(createPlantSchema),
    mode: "onChange",
    defaultValues: normalizedDefaults,
  });
  const { ref: imageFileFieldRef, onChange: imageFileOnChange, ...imageFileField } = register("imageFile");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editingId = initialValues?.id;
  const successCopy = successMessage ?? (mode === "edit" ? "Plant updated" : "Plant created");
  const submitCopy = submitLabel ?? (mode === "edit" ? "Update plant" : "Save plant");
  const previewObjectUrlRef = useRef<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(initialValues?.image ?? null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [isUsingLocalPreview, setIsUsingLocalPreview] = useState(false);
  const [imageDirty, setImageDirty] = useState(false);

  const clearObjectUrl = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, []);

  const resetImageInteractions = useCallback(() => {
    clearObjectUrl();
    setPreviewImage(initialValues?.image ?? null);
    setRemoveExistingImage(false);
    setIsUsingLocalPreview(false);
    setImageDirty(false);
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [clearObjectUrl, initialValues?.image, resetField]);

  useEffect(() => {
    reset(normalizedDefaults);
    resetImageInteractions();
  }, [normalizedDefaults, reset, resetImageInteractions]);

  useEffect(() => () => clearObjectUrl(), [clearObjectUrl]);

  const handleResult = useCallback((res?: PlantState | null) => {
    if (!res) return;
    if (res.status === "success") {
      show(successCopy, "success");
      reset(normalizedDefaults);
      resetImageInteractions();
      onClose?.();
      onSuccess?.();
      return;
    }

    if (res.fieldErrors) {
      Object.entries(res.fieldErrors).forEach(([k, v]) =>
        setError(k as keyof CreatePlantInput, { type: "server", message: String(v) }),
      );
    }

    if (res.message) {
      show(res.message, "error");
    } else if (res.status === "error") {
      show("Unable to submit form right now. Please try again.", "error");
    }
  }, [show, reset, onClose, onSuccess, setError, normalizedDefaults, successCopy, resetImageInteractions]);

  useEffect(() => {
    if (state.status === "idle") return;
    handleResult(state);
  }, [state, handleResult]);

  const validateDup = debounceFn(async (...args: unknown[]) => {
    const city = typeof args[0] === "string" ? args[0] as string : undefined;
    const country = typeof args[1] === "string" ? args[1] as string : undefined;
    if (!city || !country) return;
    try {
      const params = new URLSearchParams({ city, country });
      if (editingId) params.append("excludeId", editingId);
      const res = await fetch(`/api/plants/validate?${params.toString()}`);
      const data = await res.json();
      if (data.exists) {
        setError("city", { type: "manual", message: "A plant already exists for this city and country" });
      }
    } catch {
      // ignore
    }
  }, debounceMs ?? 350);

  useEffect(() => {
    // watch subscription for react-hook-form; call validate on changes
    // eslint-disable-next-line react-hooks/incompatible-library
    const sub = watch((val: Record<string, unknown>) => {
      const city = typeof val.city === "string" ? val.city : undefined;
      const country = typeof val.country === "string" ? val.country : undefined;
      validateDup(city, country);
    });
    return () => sub.unsubscribe();
  }, [watch, validateDup]);

  const onSubmit = async (data: FormValues) => {
    const formData = new FormData();
    formData.append("plantName", data.plantName);
    if (data.address) formData.append("address", data.address);
    formData.append("city", data.city);
    if (data.zipcode) formData.append("zipcode", data.zipcode);
    formData.append("country", data.country);
    let fileToUpload: File | undefined;
    if (data.imageFile && data.imageFile.length > 0) {
      fileToUpload = data.imageFile[0];
    } else if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
      fileToUpload = fileInputRef.current.files[0];
    }
    if (fileToUpload) {
      formData.append("imageFile", fileToUpload);
    }
    if (initialValues?.image) {
      formData.append("existingImage", initialValues.image);
      formData.append("removeImage", removeExistingImage ? "true" : "false");
    }

    if (actionOverride) {
      const overrideResult = await actionOverride(formData);
      handleResult(overrideResult as PlantState | undefined);
      return;
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    imageFileOnChange?.(event);
    const file = event.target.files?.[0];
    clearObjectUrl();
    if (file) {
      const nextUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = nextUrl;
      setPreviewImage(nextUrl);
      setRemoveExistingImage(false);
      setIsUsingLocalPreview(true);
      setImageDirty(true);
    } else {
      setPreviewImage(initialValues?.image ?? null);
      setRemoveExistingImage(false);
      setIsUsingLocalPreview(false);
      setImageDirty(false);
    }
  };

  const handleClearImage = () => {
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
    clearObjectUrl();
    setPreviewImage(null);
    if (initialValues?.image) {
      setRemoveExistingImage(true);
      setImageDirty(true);
    } else {
      setImageDirty(false);
    }
    setIsUsingLocalPreview(false);
  };

  const handleRestoreOriginal = () => {
    if (!initialValues?.image) return;
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
    clearObjectUrl();
    setPreviewImage(initialValues.image);
    setRemoveExistingImage(false);
    setIsUsingLocalPreview(false);
    setImageDirty(false);
  };

  const canSubmit = isDirty || imageDirty;
  const showPreviewMeta = Boolean(initialValues?.image || previewImage || removeExistingImage || isUsingLocalPreview);
  const showRemoveButton = Boolean(previewImage || (initialValues?.image && !removeExistingImage));
  const showRestoreButton = Boolean(initialValues?.image && (removeExistingImage || isUsingLocalPreview));
  const previewLabel = isUsingLocalPreview ? "Selected image" : "Current image";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-white shadow rounded">
      <div>
        <label htmlFor="plantName" className="block text-sm font-medium">Plant name</label>
        <input id="plantName" className="mt-1 w-full" {...register("plantName")} />
        {errors.plantName && <p className="text-red-600 text-sm">{errors.plantName.message}</p>}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium">Address</label>
        <input id="address" className="mt-1 w-full" {...register("address")} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="city" className="block text-sm font-medium">City</label>
          <input id="city" className="mt-1 w-full" {...register("city")} />
          {errors.city && <p className="text-red-600 text-sm">{errors.city.message}</p>}
        </div>
        <div>
          <label htmlFor="zipcode" className="block text-sm font-medium">Zipcode</label>
          <input id="zipcode" className="mt-1 w-full" {...register("zipcode")} />
        </div>
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium">Country</label>
        <select id="country" className="mt-1 w-full" {...register("country")}> 
          <option value="">Select country</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.country && <p className="text-red-600 text-sm">{errors.country.message}</p>}
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium">Image upload</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          className="mt-1 w-full"
          {...imageFileField}
          onChange={handleFileChange}
          ref={(element) => {
            imageFileFieldRef(element);
            fileInputRef.current = element;
          }}
        />
        {showPreviewMeta && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Plant image preview"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
                data-testid="plant-image-avatar"
                unoptimized
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white text-xs text-slate-400"
                data-testid="plant-image-placeholder"
              >
                No img
              </div>
            )}
            <div className="min-w-[140px] flex-1 text-sm">
              <p className="font-medium text-slate-700">{removeExistingImage ? "Image queued for deletion" : previewLabel}</p>
              <p className="text-xs text-slate-500">
                {removeExistingImage ? "The previous file will be deleted when you save." : previewImage ? "Image will be stored on save." : "No file selected."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {showRemoveButton && (
                <Button type="button" variant="ghost" className="cursor-pointer" onClick={handleClearImage}>
                  {initialValues?.image ? "Remove current image" : "Clear image"}
                </Button>
              )}
              {showRestoreButton && (
                <Button type="button" variant="outline" className="cursor-pointer" onClick={handleRestoreOriginal}>
                  Restore original
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!canSubmit || isSubmitting || pending}>
          {pending ? "Saving..." : submitCopy}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="cursor-pointer"
          onClick={() => {
            reset(normalizedDefaults);
            resetImageInteractions();
            onClose?.();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
