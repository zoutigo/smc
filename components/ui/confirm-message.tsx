"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: string; message: string; type?: "info" | "error" | "success" };

const ConfirmContext = createContext<{ show: (m: string, t?: Toast["type"]) => void } | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((s) => [...s, { id, message, type }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 10000);
  }, []);

  return (
    <ConfirmContext.Provider value={{ show }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-md px-4 py-2 shadow ${t.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ConfirmContext.Provider>
  );
}

export function useConfirmMessage() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirmMessage must be used within ConfirmProvider");
  return ctx;
}
