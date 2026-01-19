"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: string; message: string; type?: "info" | "error" | "success" };

const ConfirmContext = createContext<{ show: (m: string, t?: Toast["type"]) => void } | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((s) => [...s, { id, message, type }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 20000);
  }, []);

  return (
    <ConfirmContext.Provider value={{ show }}>
      {children}
      <div className="fixed right-6 top-1/2 z-[9999] flex -translate-y-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-md px-4 py-2 shadow ${
              t.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"
            }`}
          >
            <span>{t.message}</span>
            <button
              aria-label="Close notification"
              className="ml-auto rounded-full bg-white/20 px-2 py-1 text-xs font-bold hover:bg-white/30"
              onClick={() => setToasts((s) => s.filter((toast) => toast.id !== t.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ConfirmContext.Provider>
  );
}

export function useConfirmMessage() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback to avoid runtime crashes when provider is not mounted.
    return { show: (message: string) => console.warn("[ConfirmMessage]", message) };
  }
  return ctx;
}
