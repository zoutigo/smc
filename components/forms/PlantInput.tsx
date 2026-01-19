"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { plantQuickSchema } from "@/lib/validation/plant";

type PlantOption = { id: string; name: string };
type CountryOption = { id: string; name: string };

type PlantInputProps = {
  value: string;
  onChange: (id: string) => void;
  plants: PlantOption[];
  countries: CountryOption[];
  required?: boolean;
  label?: string;
  onCreated?: (plant: PlantOption) => void;
};

export function PlantInput({ value, onChange, plants, countries, required, label = "Plant", onCreated }: PlantInputProps) {
  const [plantsList, setPlantsList] = useState(plants);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantCity, setNewPlantCity] = useState("");
  const [newPlantCountryId, setNewPlantCountryId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { show } = useConfirmMessage();

  const validateInline = (next: { name: string; city: string; countryId: string }) => {
    const parsed = plantQuickSchema.safeParse(next);
    if (!parsed.success) {
      setInlineError(parsed.error.issues[0]?.message ?? "Invalid plant");
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
        className="mt-1 w-full rounded-lg border border-smc-border/80 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a plant</option>
        {plantsList.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <label className="mt-1 inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showInlineForm}
          onChange={(e) => setShowInlineForm(e.target.checked)}
        />
        Plant not in the list
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
            value={newPlantName}
            onChange={(e) => {
              const next = e.target.value;
              setNewPlantName(next);
              validateInline({ name: next, city: newPlantCity, countryId: newPlantCountryId });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="New plant name"
            className="w-full rounded-lg border border-smc-border/70 px-2 py-1 text-sm"
          />
          <input
            type="text"
            value={newPlantCity}
            onChange={(e) => {
              const next = e.target.value;
              setNewPlantCity(next);
              validateInline({ name: newPlantName, city: next, countryId: newPlantCountryId });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="City"
            className="w-full rounded-lg border border-smc-border/70 px-2 py-1 text-sm"
          />
          <select
            className="w-full rounded-lg border border-smc-border/70 px-2 py-1 text-sm"
            value={newPlantCountryId}
            onChange={(e) => {
              const next = e.target.value;
              setNewPlantCountryId(next);
              validateInline({ name: newPlantName, city: newPlantCity, countryId: next });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={!newPlantName.trim() || !newPlantCity.trim() || !newPlantCountryId || isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const name = newPlantName.trim();
              const city = newPlantCity.trim();
              if (!name || !city || !newPlantCountryId) return;
              if (!validateInline({ name, city, countryId: newPlantCountryId })) return;
              startTransition(async () => {
                setInlineError(null);
                try {
                  const response = await fetch("/api/quick/plant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, city, countryId: newPlantCountryId }),
                  });
                  const result = await response.json();
                  if (!result.ok) {
                    const message = result.error ?? "Unable to create plant";
                    setInlineError(message);
                    show(message, "error");
                    return;
                  }
                  const created = result.plant as { id: string; name: string };
                  setPlantsList((prev) => [...prev, { id: created.id, name: created.name }]);
                  onChange(created.id);
                  onCreated?.({ id: created.id, name: created.name });
                  setNewPlantName("");
                  setNewPlantCity("");
                  setNewPlantCountryId("");
                  setShowInlineForm(false);
                  show("Plant created and available in the list.", "success");
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : "Unable to create plant";
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
