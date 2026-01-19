"use client";

import { useState } from "react";

export type GalleryImage = { id: string; url: string };

type GalleryProps = {
  images: GalleryImage[];
  title?: string;
};

export function Gallery({ images, title }: GalleryProps) {
  const [activeId, setActiveId] = useState<string | undefined>(images[0]?.id);
  const activeImage = images.find((img) => img.id === activeId)?.url ?? images[0]?.url;
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        className="flex-[2] min-h-[60vh] overflow-hidden rounded-xl border border-smc-border/70 bg-smc-bg/60 cursor-pointer"
        onClick={() => setShowModal(Boolean(activeImage))}
      >
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeImage} alt={title ?? "Gallery image"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[60vh] items-center justify-center text-sm text-smc-text-muted">No image available</div>
        )}
      </div>
      <div className="flex flex-1 flex-wrap content-start gap-2 overflow-y-auto rounded-xl border border-smc-border/70 bg-white p-2 shadow-inner max-h-[30vh]">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveId(img.id)}
            className={`overflow-hidden rounded-lg border ${img.id === activeId ? "border-smc-secondary ring-2 ring-smc-secondary/40" : "border-smc-border/70"} bg-white cursor-pointer`}
            style={{ height: "70px", width: "70px" }}
            aria-label="Thumbnail"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="Gallery" className="h-full w-full object-cover" />
          </button>
        ))}
        {images.length === 0 ? <span className="text-xs text-smc-text-muted">No images.</span> : null}
      </div>

      {showModal && activeImage ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowModal(false)}>
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg ring-2 ring-red-300/70 hover:bg-red-700"
              onClick={() => setShowModal(false)}
              aria-label="Close image modal"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage} alt={title ?? "Gallery image"} className="max-h-[90vh] max-w-[90vw] object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
