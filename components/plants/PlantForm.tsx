"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

import { type CreatePlantInput } from "@/app/plants/schema";
import { createPlantAction, type PlantState } from "@/app/plants/actions";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";

const plantFormSchema = z.object({
  name: z.string().min(1, "Plant name is required"),
  addressId: z
    .string()
    .uuid("Address ID must be a valid UUID")
    .or(z.literal(""))
    .transform((value) => (value && value.length ? value : undefined)),
  imageUrl: z.string().url("Image must be a valid URL").optional(),
  imageFile: z.any().optional(),
});

type FormValues = {
  name: string;
  addressId: string | undefined;
  imageUrl?: string;
  imageFile?: FileList;
};

type PlantFormInitialValues = Partial<FormValues> & { id?: string };

interface PlantFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  actionOverride?: (fd: FormData) => Promise<unknown>;
  initialValues?: PlantFormInitialValues;
  mode?: "create" | "edit";
  submitLabel?: string;
  successMessage?: string;
}

export default function PlantForm({
  onClose,
  onSuccess,
  actionOverride,
  initialValues,
  mode = "create",
  submitLabel,
  successMessage,
}: PlantFormProps) {
  const { show } = useConfirmMessage();

  const normalizedDefaults = useMemo(() => ({
    name: initialValues?.name ?? "",
    addressId: initialValues?.addressId ?? undefined,
    imageUrl: initialValues?.imageUrl ?? undefined,
  }), [initialValues]);

  const { register, handleSubmit, watch, formState: { errors, isDirty, isSubmitting }, setError, reset, resetField } = useForm<FormValues>({
    resolver: zodResolver(plantFormSchema) as unknown as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: normalizedDefaults,
  });

  const watchAddressId = watch("addressId");
  const { ref: imageFileFieldRef, onChange: imageFileFieldOnChange, ...imageFileField } = register("imageFile");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(initialValues?.imageUrl ?? null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const successCopy = successMessage ?? (mode === "edit" ? "Plant updated" : "Plant created");
  const submitCopy = submitLabel ?? (mode === "edit" ? "Update plant" : "Save plant");

  const clearObjectUrl = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, []);

  const resetImageInteractions = useCallback(() => {
    clearObjectUrl();
    setPreviewImage(initialValues?.imageUrl ?? null);
    setRemoveExistingImage(false);
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [clearObjectUrl, initialValues?.imageUrl, resetField]);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    clearObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewImage(objectUrl);
    setRemoveExistingImage(false);
  };

  const handleClearImage = () => {
    clearObjectUrl();
    setPreviewImage(null);
    setRemoveExistingImage(true);
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRestoreOriginal = () => {
    clearObjectUrl();
    setPreviewImage(initialValues?.imageUrl ?? null);
    setRemoveExistingImage(false);
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.addressId) formData.append("addressId", values.addressId);

    const file = values.imageFile?.[0];
    if (file) formData.append("imageFile", file);

    if (initialValues?.id) formData.append("id", initialValues.id);
    formData.append("removeImage", removeExistingImage ? "true" : "false");
    if (initialValues?.addressId && !values.addressId) {
      formData.append("clearAddress", "true");
    }

    const action = actionOverride ?? ((fd: FormData) => createPlantAction({ status: "idle" }, fd));

    try {
      const res = (await action(formData)) as PlantState | null | undefined;
      handleResult(res);
    } finally {
      setSubmitting(false);
    }
  };

  const previewLabel = removeExistingImage
    ? "Image removed"
    : previewImage
      ? "Image preview"
      : initialValues?.imageUrl
        ? "Current image"
        : "No image selected";

  const showPreviewMeta = Boolean(previewImage) || Boolean(initialValues?.imageUrl) || removeExistingImage;
  const showRemoveButton = Boolean(previewImage) || Boolean(initialValues?.imageUrl);
  const showRestoreButton = Boolean(initialValues?.imageUrl) && removeExistingImage;
  const clearedAddress = Boolean(initialValues?.addressId) && !watchAddressId;
  const canSubmit = isDirty || removeExistingImage || clearedAddress;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl bg-white/95 p-5 shadow-card">
      <div className="space-y-1">
        <label htmlFor="plant-name" className="block text-sm font-semibold text-smc-text">Plant name</label>
        <input
          id="plant-name"
          className="mt-1 w-full rounded-xl border border-smc-border/70 bg-smc-bg/30 px-3 py-2 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-smc-primary/40"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="address-id" className="block text-sm font-semibold text-smc-text">Address ID (optional)</label>
        <input
          id="address-id"
          className="mt-1 w-full rounded-xl border border-smc-border/70 bg-smc-bg/30 px-3 py-2 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-smc-primary/40"
          placeholder="UUID of an existing address"
          {...register("addressId")}
        />
        {initialValues?.addressId && (
          <p className="text-xs text-smc-text-muted">Clear the field to remove the current address link.</p>
        )}
        {errors.addressId && <p className="text-sm text-red-600">{errors.addressId.message}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-smc-text">Image upload</p>
            <p className="text-xs text-smc-text-muted">JPG or PNG; leave empty to keep current image.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="plant-image" className="sr-only">Image upload</label>
          <input
            id="plant-image"
            type="file"
            accept="image/*"
            className="sr-only"
            {...imageFileField}
            onChange={(event) => {
              imageFileFieldOnChange(event);
              handleFileChange(event);
            }}
            ref={(element) => {
              imageFileFieldRef(element);
              fileInputRef.current = element;
            }}
          />
          <Button type="button" variant="outline" className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            Choose image
          </Button>
          <span className="text-xs text-smc-text-muted">{previewImage ? "Image selected" : "No image chosen"}</span>
        </div>

        {showPreviewMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-smc-border/70 bg-smc-bg/40 p-3">
            {previewImage ? (
              <Image
                src={previewImage}
                alt={previewLabel}
                width={96}
                height={96}
                className="h-24 w-24 rounded-xl object-cover"
                data-testid="plant-image-avatar"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-smc-border/70 bg-white text-xs text-smc-text-muted">
                No image
              </div>
            )}
            <div className="flex flex-1 flex-wrap items-center gap-2 text-sm text-smc-text">
              <span className="font-semibold">{previewLabel}</span>
              {showRemoveButton && (
                <Button type="button" variant="ghost" onClick={handleClearImage} className="h-9 px-3 cursor-pointer">
                  {initialValues?.imageUrl ? "Remove current image" : "Clear image"}
                </Button>
              )}
              {showRestoreButton && (
                <Button type="button" variant="outline" onClick={handleRestoreOriginal} className="h-9 px-3 cursor-pointer">
                  Restore original
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting || isSubmitting} className="cursor-pointer">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit || submitting || isSubmitting} className="cursor-pointer">
          {submitting || isSubmitting ? "Submitting..." : submitCopy}
        </Button>
      </div>
    </form>
  );
}
