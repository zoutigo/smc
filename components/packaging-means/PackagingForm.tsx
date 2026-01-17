"use client";

import React, { useCallback, useEffect, startTransition, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createPackagingMeanCategoryAction, type PackagingMeanCategoryState } from "@/app/packaging-means/actions";
import { createPackagingMeanCategorySchema, type CreatePackagingMeanCategoryInput } from "@/app/packaging-means/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmMessage } from "@/components/ui/confirm-message";

type FormValues = {
  name: string;
  description: string;
  imageUrl?: string;
  imageFile?: FileList;
};

type PackagingFormInitialValues = Partial<FormValues> & { id?: string };

interface PackagingFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  actionOverride?: (fd: FormData) => Promise<unknown>;
  initialValues?: PackagingFormInitialValues;
  mode?: "create" | "edit";
  submitLabel?: string;
  successMessage?: string;
}

export default function PackagingForm({
  onClose,
  onSuccess,
  actionOverride,
  initialValues,
  mode = "create",
  submitLabel,
  successMessage,
}: PackagingFormProps) {
  const initialState: PackagingMeanCategoryState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    createPackagingMeanCategoryAction as unknown as (s: PackagingMeanCategoryState, fd: FormData) => Promise<PackagingMeanCategoryState>,
    initialState,
  );
  const { show } = useConfirmMessage();

  const normalizedDefaults = useMemo<FormValues>(() => ({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    imageUrl: initialValues?.imageUrl ?? undefined,
  }), [initialValues?.name, initialValues?.description, initialValues?.imageUrl]);

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, setError, reset, resetField } = useForm<FormValues>({
    resolver: zodResolver(createPackagingMeanCategorySchema),
    mode: "onChange",
    defaultValues: normalizedDefaults,
  });

  const { ref: imageFileFieldRef, onChange: imageFileOnChange, ...imageFileField } = register("imageFile");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const successCopy = successMessage ?? (mode === "edit" ? "Category updated" : "Category created");
  const submitCopy = submitLabel ?? (mode === "edit" ? "Update category" : "Save category");
  const previewObjectUrlRef = useRef<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(initialValues?.imageUrl ?? null);
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
    setPreviewImage(initialValues?.imageUrl ?? null);
    setRemoveExistingImage(false);
    setIsUsingLocalPreview(false);
    setImageDirty(false);
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [clearObjectUrl, initialValues?.imageUrl, resetField]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    reset(normalizedDefaults);
    resetImageInteractions();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [normalizedDefaults, reset, resetImageInteractions]);

  useEffect(() => () => clearObjectUrl(), [clearObjectUrl]);

  const handleResult = useCallback((res?: PackagingMeanCategoryState | null) => {
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
      Object.entries(res.fieldErrors).forEach(([key, value]) =>
        setError(key as keyof CreatePackagingMeanCategoryInput, { type: "server", message: String(value) }),
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
    /* eslint-disable react-hooks/set-state-in-effect */
    handleResult(state);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [state, handleResult]);

  const onSubmit = useCallback(async (data: FormValues) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    if (data.imageUrl) formData.append("imageUrl", data.imageUrl);

    let fileToUpload: File | undefined;
    if (data.imageFile && data.imageFile.length > 0) {
      fileToUpload = data.imageFile[0];
    } else if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
      fileToUpload = fileInputRef.current.files[0];
    }
    if (fileToUpload) {
      formData.append("imageFile", fileToUpload);
    }
    if (initialValues?.imageUrl) {
      formData.append("existingImageUrl", initialValues.imageUrl);
      formData.append("removeImage", removeExistingImage ? "true" : "false");
    }

    if (actionOverride) {
      const overrideResult = await actionOverride(formData);
      handleResult(overrideResult as PackagingMeanCategoryState | undefined);
      return;
    }

    startTransition(() => {
      formAction(formData);
    });
  }, [actionOverride, formAction, handleResult, initialValues, removeExistingImage]);

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
      setPreviewImage(initialValues?.imageUrl ?? null);
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
    if (initialValues?.imageUrl) {
      setRemoveExistingImage(true);
      setImageDirty(true);
    } else {
      setImageDirty(false);
    }
    setIsUsingLocalPreview(false);
  };

  const handleRestoreOriginal = () => {
    if (!initialValues?.imageUrl) return;
    resetField("imageFile", { defaultValue: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
    clearObjectUrl();
    setPreviewImage(initialValues.imageUrl);
    setRemoveExistingImage(false);
    setIsUsingLocalPreview(false);
    setImageDirty(false);
  };

  const canSubmit = isDirty || imageDirty;
  const showPreviewMeta = Boolean(initialValues?.imageUrl || previewImage || removeExistingImage || isUsingLocalPreview);
  const showRemoveButton = Boolean(previewImage || (initialValues?.imageUrl && !removeExistingImage));
  const showRestoreButton = Boolean(initialValues?.imageUrl && (removeExistingImage || isUsingLocalPreview));
  const previewLabel = isUsingLocalPreview ? "Selected image" : "Current image";
  const onFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  }, [handleSubmit, onSubmit]);

  return (
    <form
      onSubmit={onFormSubmit}
      className="space-y-5 rounded-2xl bg-white/95 p-5 shadow-card"
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="packaging-name" className="text-sm font-semibold text-smc-text">
            Packaging category name
          </label>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-smc-primary/80">Required</span>
        </div>
        <Input
          id="packaging-name"
          placeholder="e.g. Trolley"
          className="h-11 rounded-xl border-smc-border/70 bg-smc-bg/40 text-sm shadow-inner transition focus-visible:ring-2 focus-visible:ring-smc-primary/40"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="packaging-description" className="text-sm font-semibold text-smc-text">
            Description
          </label>
          <span className="text-[11px] uppercase tracking-[0.22em] text-smc-text-muted">Tell the essentials</span>
        </div>
        <textarea
          id="packaging-description"
          className="mt-1 w-full resize-none rounded-xl border border-smc-border/70 bg-smc-bg/40 px-3 py-3 text-sm leading-relaxed text-smc-text shadow-inner outline-none transition focus:ring-2 focus:ring-smc-primary/40"
          rows={4}
          placeholder="What makes this packaging category unique?"
          {...register("description")}
        />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-smc-text">Cover image</p>
            <p className="text-xs text-smc-text-muted">Edge-to-edge visual; JPG or PNG works best.</p>
          </div>
          <span className="rounded-full bg-smc-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-smc-secondary">
            Optional
          </span>
        </div>

        <label htmlFor="packaging-image" className="sr-only">Image upload</label>
        <input
          id="packaging-image"
          type="file"
          accept="image/*"
          className="sr-only"
          {...imageFileField}
          onChange={handleFileChange}
          ref={(element) => {
            imageFileFieldRef(element);
            fileInputRef.current = element;
          }}
        />

        <label
          htmlFor="packaging-image"
          className="group relative block cursor-pointer overflow-hidden rounded-xl border border-dashed border-smc-border/90 bg-gradient-to-br from-white via-smc-bg/70 to-white p-3 shadow-soft transition hover:border-smc-secondary/50 hover:shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-smc-secondary/12 text-sm font-semibold uppercase text-smc-secondary ring-1 ring-smc-border/60">
              Upload
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-smc-text">Drop an image or click to browse</p>
              <p className="text-xs text-smc-text-muted">Landscape orientation recommended. We will auto-fit it edge-to-edge.</p>
            </div>
          </div>
        </label>

        {showPreviewMeta && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-smc-border/80 bg-white/90 p-3 shadow-inner">
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Packaging category image preview"
                width={80}
                height={80}
                className="h-20 w-20 rounded-xl object-cover ring-1 ring-smc-border/60"
                data-testid="packaging-image-avatar"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-smc-border bg-smc-bg text-[11px] uppercase tracking-[0.18em] text-smc-text-muted" data-testid="packaging-image-placeholder">
                No img
              </div>
            )}
            <div className="min-w-[200px] flex-1 text-sm">
              <p className="font-semibold text-smc-text">{removeExistingImage ? "Image queued for deletion" : previewLabel}</p>
              <p className="text-xs text-smc-text-muted">
                {removeExistingImage ? "The previous file will be deleted when you save." : previewImage ? "Image will be stored on save." : "No file selected."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {showRemoveButton && (
                <Button type="button" variant="ghost" className="cursor-pointer" onClick={handleClearImage}>
                  {initialValues?.imageUrl ? "Remove current image" : "Clear image"}
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
