"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { accessoryQuickSchema } from "@/lib/validation/accessory";

type Option = { id: string; name: string };

type AccessoryInputProps = {
  value: string;
  onChange: (id: string) => void;
  accessories: Option[];
  plants: Option[];
  suppliers: Option[];
  label?: string;
  required?: boolean;
  onCreated?: (accessory: Option) => void;
};

export function AccessoryInput({
  value,
  onChange,
  accessories,
  plants,
  suppliers,
  label = "Accessory",
  required,
  onCreated,
}: AccessoryInputProps) {
  const [accessoryList, setAccessoryList] = useState(accessories);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [name, setName] = useState("");
  const [plantId, setPlantId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { show } = useConfirmMessage();

  const validate = (next: { name: string; plantId: string; supplierId?: string }) => {
    const parsed = accessoryQuickSchema.safeParse({
      ...next,
      supplierId: next.supplierId || undefined,
      unitPrice: 0,
    });
    if (!parsed.success) {
      setInlineError(parsed.error.issues[0]?.message ?? "Invalid accessory");
      return false;
    }
    setInlineError(null);
    return true;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-smc-text">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <select
        className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">Select an accessory</option>
        {accessoryList.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <label className="mt-1 inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showInlineForm}
          onChange={(e) => setShowInlineForm(e.target.checked)}
        />
        Accessory not in the list
      </label>

      {showInlineForm ? (
        <div
          className="mt-2 space-y-2 rounded-lg border border-smc-border/70 p-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => {
              const next = e.target.value;
              setName(next);
              validate({ name: next, plantId, supplierId });
            }}
            placeholder="Accessory name"
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
            aria-label="Accessory name"
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
          <select
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
            value={plantId}
            onChange={(e) => {
              const next = e.target.value;
              setPlantId(next);
              validate({ name, plantId: next, supplierId });
            }}
            aria-label="Accessory plant"
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          >
            <option value="">Select a plant</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
            value={supplierId}
            onChange={(e) => {
              const next = e.target.value;
              setSupplierId(next);
              validate({ name, plantId, supplierId: next });
            }}
            aria-label="Accessory supplier"
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          >
            <option value="">Select a supplier (optional)</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={!name.trim() || !plantId || isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const trimmedName = name.trim();
              if (!trimmedName || !plantId) return;
              if (!validate({ name: trimmedName, plantId, supplierId })) return;
              startTransition(async () => {
                try {
                  const response = await fetch("/api/quick/accessory", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: trimmedName,
                      plantId,
                      supplierId: supplierId || undefined,
                    }),
                  });
                  const result = await response.json();
                  if (!result.ok) {
                    const message = result.error ?? "Unable to create accessory";
                    setInlineError(message);
                    show(message, "error");
                    return;
                  }
                  const created = result.accessory as { id: string; name: string };
                  setAccessoryList((prev) => [...prev, created]);
                  onChange(created.id);
                  onCreated?.(created);
                  setName("");
                  setPlantId("");
                  setSupplierId("");
                  setShowInlineForm(false);
                  show("Accessory created and available in the list.", "success");
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : "Unable to create accessory";
                  setInlineError(message);
                  show(message, "error");
                }
              });
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Add
          </Button>
          {inlineError ? <p className="text-sm text-red-600">{inlineError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
