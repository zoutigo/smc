"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { partFamilyQuickSchema } from "@/lib/validation/part-family";

type PartFamilyOption = { id: string; name: string };

type PartFamilyInputProps = {
  value: string;
  onChange: (id: string) => void;
  families: PartFamilyOption[];
  label?: string;
  allowInline?: boolean;
  onCreated?: (family: PartFamilyOption) => void;
};

export function PartFamilyInput({
  value,
  onChange,
  families,
  label = "Part family",
  allowInline = true,
  onCreated,
}: PartFamilyInputProps) {
  const [familyList, setFamilyList] = useState(families);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [name, setName] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { show } = useConfirmMessage();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-smc-text">{label}</label>
      <select
        className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">Select family</option>
        {familyList.map((pf) => (
          <option key={pf.id} value={pf.id}>{pf.name}</option>
        ))}
      </select>

      {allowInline ? (
        <>
          <label className="mt-1 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInlineForm}
              onChange={(e) => setShowInlineForm(e.target.checked)}
            />
            Family not in the list
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
                className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
                placeholder="New family name"
                value={name}
                onChange={(e) => {
                  const next = e.target.value;
                  setName(next);
                  const parsed = partFamilyQuickSchema.safeParse({ name: next });
                  if (!parsed.success) {
                    setInlineError(parsed.error.issues[0]?.message ?? "Invalid name");
                  } else {
                    setInlineError(null);
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              />
              <Button
                type="button"
                size="sm"
                disabled={!name.trim() || isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const trimmed = name.trim();
                  const parsed = partFamilyQuickSchema.safeParse({ name: trimmed });
                  if (!parsed.success) {
                    setInlineError(parsed.error.issues[0]?.message ?? "Invalid name");
                    return;
                  }
                  startTransition(async () => {
                    try {
                      const response = await fetch("/api/quick/part-family", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: trimmed }),
                      });
                      const result = await response.json();
                      if (!result.ok) {
                        const message = result.error ?? "Unable to create family";
                        setInlineError(message);
                        show(message, "error");
                        return;
                      }
                      const created = result.partFamily as PartFamilyOption;
                      setFamilyList((prev) => [...prev, created]);
                      onChange(created.id);
                      onCreated?.(created);
                      setName("");
                      setShowInlineForm(false);
                      setInlineError(null);
                      show("Part family created and available in the list.", "success");
                    } catch (error: unknown) {
                      const message = error instanceof Error ? error.message : "Unable to create family";
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
                Add family
              </Button>
              {inlineError ? <p className="text-sm text-red-600">{inlineError}</p> : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
