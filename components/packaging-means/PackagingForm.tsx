"use client";

import React, { useCallback, useEffect, startTransition, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createPackagingCategoryAction, type PackagingCategoryState } from "@/app/packaging-means/actions";
import { createPackagingCategorySchema, type CreatePackagingCategoryInput } from "@/app/packaging-means/schema";
import { Button } from "@/components/ui/button";
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
  const initialState: PackagingCategoryState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    createPackagingCategoryAction as unknown as (s: PackagingCategoryState, fd: FormData) => Promise<PackagingCategoryState>,
    initialState,
  );
  const { show } = useConfirmMessage();

  const normalizedDefaults = useMemo<FormValues>(() => ({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    imageUrl: initialValues?.imageUrl ?? undefined,
  }), [initialValues?.name, initialValues?.description, initialValues?.imageUrl]);

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, setError, reset, resetField } = useForm<FormValues>({
    resolver: zodResolver(createPackagingCategorySchema),
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

  const handleResult = useCallback((res?: PackagingCategoryState | null) => {
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
        setError(key as keyof CreatePackagingCategoryInput, { type: "server", message: String(value) }),
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
      handleResult(overrideResult as PackagingCategoryState | undefined);
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
    <form onSubmit={onFormSubmit} className="space-y-4 rounded bg-white p-4 shadow">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Category name</label>
        <input id="name" className="mt-1 w-full" {...register("name")} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea id="description" className="mt-1 w-full resize-none" rows={4} {...register("description")} />
        {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
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
                alt="Packaging category image preview"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
                data-testid="packaging-image-avatar"
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white text-xs text-slate-400" data-testid="packaging-image-placeholder">
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
