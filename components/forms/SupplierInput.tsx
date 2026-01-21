"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { supplierQuickSchema } from "@/lib/validation/supplier";

type SupplierOption = { id: string; name: string };
type CountryOption = { id: string; name: string };

type SupplierInputProps = {
  value: string;
  onChange: (id: string) => void;
  suppliers: SupplierOption[];
  countries: CountryOption[];
  required?: boolean;
  label?: string;
  onCreated?: (supplier: SupplierOption) => void;
};

export function SupplierInput({
  value,
  onChange,
  suppliers,
  countries,
  required,
  label = "Supplier",
  onCreated,
}: SupplierInputProps) {
  const [suppliersList, setSuppliersList] = useState(suppliers);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierCity, setNewSupplierCity] = useState("");
  const [newSupplierCountryId, setNewSupplierCountryId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { show } = useConfirmMessage();

  const validateInline = (next: { name: string; city: string; countryId: string }) => {
    const parsed = supplierQuickSchema.safeParse(next);
    if (!parsed.success) {
      setInlineError(parsed.error.issues[0]?.message ?? "Invalid supplier");
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
      >
        <option value="">Select a supplier</option>
        {suppliersList.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <label className="mt-1 inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showInlineForm} onChange={(e) => setShowInlineForm(e.target.checked)} />
        Supplier not in the list
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
            value={newSupplierName}
            onChange={(e) => {
              const next = e.target.value;
              setNewSupplierName(next);
              validateInline({ name: next, city: newSupplierCity, countryId: newSupplierCountryId });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="New supplier name"
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
          />
          <input
            type="text"
            value={newSupplierCity}
            onChange={(e) => {
              const next = e.target.value;
              setNewSupplierCity(next);
              validateInline({ name: newSupplierName, city: next, countryId: newSupplierCountryId });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="City"
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
          />
          <select
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
            value={newSupplierCountryId}
            onChange={(e) => {
              const next = e.target.value;
              setNewSupplierCountryId(next);
              validateInline({ name: newSupplierName, city: newSupplierCity, countryId: next });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={!newSupplierName.trim() || !newSupplierCity.trim() || !newSupplierCountryId || isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const name = newSupplierName.trim();
              const city = newSupplierCity.trim();
              if (!name || !city || !newSupplierCountryId) return;
              if (!validateInline({ name, city, countryId: newSupplierCountryId })) return;
              startTransition(async () => {
                setInlineError(null);
                try {
                  const response = await fetch("/api/quick/supplier", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, city, countryId: newSupplierCountryId }),
                  });
                  const result = await response.json();
                  if (!result.ok) {
                    const message = result.error ?? "Unable to create supplier";
                    setInlineError(message);
                    show(message, "error");
                    return;
                  }
                  const created = result.supplier as { id: string; name: string };
                  setSuppliersList((prev) => [...prev, { id: created.id, name: created.name }]);
                  onChange(created.id);
                  onCreated?.({ id: created.id, name: created.name });
                  setNewSupplierName("");
                  setNewSupplierCity("");
                  setNewSupplierCountryId("");
                  setShowInlineForm(false);
                  show("Supplier created and available in the list.", "success");
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : "Unable to create supplier";
                  setInlineError(message);
                  show(message, "error");
                }
              });
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-inline="true"
          >
            Add
          </Button>
          {inlineError ? <p className="text-sm text-red-600">{inlineError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
