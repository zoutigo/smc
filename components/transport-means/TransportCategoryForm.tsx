"use client";

import React, { useCallback, useEffect, startTransition, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createTransportMeanCategoryAction, type TransportMeanCategoryState } from "@/app/transport-means/actions";
import { createTransportMeanCategorySchema, type CreateTransportMeanCategoryInput } from "@/app/transport-means/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmMessage } from "@/components/ui/confirm-message";

type FormValues = {
  name: string;
  description: string;
  imageUrl?: string;
  imageFile?: FileList;
};

type TransportFormInitialValues = Partial<FormValues> & { id?: string };

interface TransportCategoryFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  actionOverride?: (fd: FormData) => Promise<unknown>;
  initialValues?: TransportFormInitialValues;
  mode?: "create" | "edit";
  submitLabel?: string;
  successMessage?: string;
}

export default function TransportCategoryForm({
  onClose,
  onSuccess,
  actionOverride,
  initialValues,
  mode = "create",
  submitLabel,
  successMessage,
}: TransportCategoryFormProps) {
  const initialState: TransportMeanCategoryState = { status: "idle" };
  const [state, formAction, pending] = useActionState(
    createTransportMeanCategoryAction as unknown as (s: TransportMeanCategoryState, fd: FormData) => Promise<TransportMeanCategoryState>,
    initialState,
  );
  const { show } = useConfirmMessage();

  const normalizedDefaults = useMemo<FormValues>(() => ({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    imageUrl: initialValues?.imageUrl ?? undefined,
  }), [initialValues?.name, initialValues?.description, initialValues?.imageUrl]);

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, setError, reset, resetField } = useForm<FormValues>({
    resolver: zodResolver(createTransportMeanCategorySchema),
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

  const handleResult = useCallback((res?: TransportMeanCategoryState | null) => {
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
        setError(key as keyof CreateTransportMeanCategoryInput, { type: "server", message: String(value) }),
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
      handleResult(overrideResult as TransportMeanCategoryState | undefined);
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
    <form onSubmit={onFormSubmit} className="space-y-5 rounded-2xl bg-white/95 p-5 shadow-card">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="transport-name" className="text-sm font-semibold text-smc-text">
            Name
          </label>
          <span className="text-xs text-smc-text-muted">{mode === "edit" ? "Edit category" : "New category"}</span>
        </div>
        <Input id="transport-name" autoComplete="off" placeholder="Transport category name" {...register("name")} />
        {errors.name?.message ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="transport-description" className="text-sm font-semibold text-smc-text">
          Description
        </label>
        <textarea
          id="transport-description"
          className="min-h-[96px] w-full rounded-lg border border-smc-border/80 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
          placeholder="What makes this transport category unique?"
          {...register("description")}
        />
        {errors.description?.message ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-smc-text">Image (optional)</span>
          {showPreviewMeta && (
            <span className="rounded-full bg-smc-bg px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-smc-primary">{previewLabel}</span>
          )}
        </div>
        {previewImage ? (
          <div className="overflow-hidden rounded-xl border border-smc-border/80">
            <Image src={previewImage} alt="Preview image" width={640} height={360} className="h-40 w-full object-cover" unoptimized />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Input
            type="file"
            accept="image/*"
            ref={(node) => {
              fileInputRef.current = node;
              imageFileFieldRef(node);
            }}
            onChange={handleFileChange}
            {...imageFileField}
          />
          {showRemoveButton ? (
            <Button type="button" variant="ghost" onClick={handleClearImage} className="text-sm text-destructive">
              {removeExistingImage ? "Remove image" : "Clear image"}
            </Button>
          ) : null}
          {showRestoreButton ? (
            <Button type="button" variant="ghost" onClick={handleRestoreOriginal} className="text-sm text-smc-primary">
              Restore original
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || isSubmitting || !canSubmit}>
          {pending || isSubmitting ? "Saving..." : submitCopy}
        </Button>
      </div>
    </form>
  );
}
