"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_MB } from "@/lib/constants/uploads";

type ImageInputProps = {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
  helperText?: string;
  error?: string | null;
  existingImages?: Array<{ id: string; url: string }>;
  onRemoveExisting?: (id: string) => void;
};

export function ImageInput({
  files,
  onChange,
  label = "Images",
  helperText = "Drop at least one image.",
  error,
  existingImages = [],
  onRemoveExisting,
}: ImageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const maxBytes = useMemo(() => MAX_IMAGE_UPLOAD_BYTES, []);
  const combinedError = error ?? localError;

  const handleFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (incoming.some((f) => !f.type.startsWith("image/"))) {
      setLocalError("Only image files are allowed (png, jpg, webp).");
      return;
    }
    const totalSize = incoming.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > maxBytes) {
      setLocalError(`Images must total less than ${MAX_IMAGE_UPLOAD_MB} MB.`);
      return;
    }
    setLocalError(null);
    onChange(incoming);
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-base font-semibold text-smc-text">{label}</h3>
        <p className="text-sm text-smc-text-muted">{helperText}</p>
      </div>
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition ${
          isDragging ? "border-smc-primary bg-smc-primary/10" : "border-smc-border/80 bg-white"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files ?? []);
          setIsDragging(false);
        }}
      >
        <p className="text-sm font-semibold text-smc-text">Drag & drop images here</p>
        <p className="text-xs text-smc-text-muted">You can add multiple images at once.</p>
        <div className="mt-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files ?? [])}
          />
        </div>
      </div>
      {files.length ? (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="flex items-center gap-2 rounded bg-smc-primary/10 px-2 py-1 text-xs text-smc-primary">
              <span>{file.name}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Remove image"
                className="h-7 w-7 rounded-full text-red-600 hover:bg-red-100"
                onClick={() => {
                  const updated = [...files];
                  updated.splice(idx, 1);
                  onChange(updated);
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      {existingImages.length ? (
        <div className="flex flex-wrap gap-3">
          {existingImages.map((img) => (
            <div key={img.id} className="relative flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-smc-border/70 bg-white">
              <Image src={img.url} alt="Existing image" fill className="object-cover" sizes="112px" />
              {onRemoveExisting ? (
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-red-600 shadow"
                  onClick={() => onRemoveExisting(img.id)}
                  aria-label="Remove existing image"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {combinedError ? <p className="text-sm text-red-600">{combinedError}</p> : null}
    </div>
  );
}
