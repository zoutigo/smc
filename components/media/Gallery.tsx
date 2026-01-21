"use client";

import { useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type GalleryImage = { id: string; url: string };

type GalleryProps = {
  images: GalleryImage[];
  title?: string;
};

export function Gallery({ images, title }: GalleryProps) {
  const initial = images?.[0]?.url ?? null;
  const [selected, setSelected] = useState<string | null>(initial);
  const [showModal, setShowModal] = useState(false);

  const modal =
    showModal && selected
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
            <div className="relative max-h-[90vh] max-w-[90vw]">
              <Button
                type="button"
                className="absolute -right-3 -top-3 rounded-full bg-red-500 px-3 py-1 text-white"
                onClick={() => setShowModal(false)}
                aria-label="Close image modal"
              >
                Close
              </Button>
              <div className="overflow-hidden rounded-2xl bg-white p-2">
                <Image
                  src={selected}
                  alt={`${title ?? "Gallery"} modal`}
                  width={1200}
                  height={800}
                  className="h-[80vh] max-h-[80vh] w-full max-w-[80vw] object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const hasImages = images && images.length > 0;

  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-2xl border border-smc-border/70 bg-smc-bg/40 shadow-inner"
        onClick={() => selected && setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && selected) setShowModal(true);
        }}
        style={{ cursor: selected ? "pointer" : "default" }}
      >
        {selected ? (
          <Image
            src={selected}
            alt={`${title ?? "Gallery"} hero`}
            width={800}
            height={600}
            className="h-80 w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-80 items-center justify-center text-sm text-smc-text-muted">No image available</div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {hasImages ? (
          images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              aria-label="thumbnail"
              onClick={() => setSelected(img.url)}
              className={cn(
                "overflow-hidden rounded-xl border px-1 py-1",
                selected === img.url ? "border-smc-primary ring-2 ring-smc-primary/40" : "border-smc-border/70"
              )}
              style={{ width: "64px", height: "64px", cursor: "pointer" }}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            </button>
          ))
        ) : (
          <p className="text-xs text-smc-text-muted">No images.</p>
        )}
      </div>
      {modal}
    </div>
  );
}
