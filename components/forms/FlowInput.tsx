"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { flowQuickSchema } from "@/lib/validation/flow";

type FlowOption = { id: string; from: string; to: string; slug: string };

type FlowInputProps = {
  value: string;
  onChange: (id: string) => void;
  flows: FlowOption[];
  label?: string;
  allowInline?: boolean;
  onCreated?: (flow: FlowOption) => void;
};

const flowStations = ["INJECTION", "PAINT", "ASSEMBLY", "BONDING", "INSPECTION", "SILS", "CUSTOMER", "WAREHOUSE"];

export function FlowInput({
  value,
  onChange,
  flows,
  label = "Flow",
  allowInline = true,
  onCreated,
}: FlowInputProps) {
  const [flowsList, setFlowsList] = useState(flows);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [newFlow, setNewFlow] = useState({ from: "", to: "" });
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { show } = useConfirmMessage();

  const validate = useMemo(
    () => (payload: { from: string; to: string }) => {
      const parsed = flowQuickSchema.safeParse(payload);
      if (!parsed.success) {
        setInlineError(parsed.error.issues[0]?.message ?? "Invalid flow");
        return false;
      }
      setInlineError(null);
      return true;
    },
    []
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-smc-text">{label}</label>
      <select
        className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">No flow</option>
        {flowsList.map((f) => (
          <option key={f.id} value={f.id}>{f.from} → {f.to}</option>
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
            Flow not in the list
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
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
                  value={newFlow.from}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewFlow((s) => ({ ...s, from: next }));
                    validate({ from: next, to: newFlow.to });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                >
                  <option value="">From station</option>
                  {flowStations.map((station) => (
                    <option key={station} value={station}>{station}</option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
                  value={newFlow.to}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewFlow((s) => ({ ...s, to: next }));
                    validate({ from: newFlow.from, to: next });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                >
                  <option value="">To station</option>
                  {flowStations.map((station) => (
                    <option key={station} value={station}>{station}</option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!newFlow.from || !newFlow.to || isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!validate({ from: newFlow.from, to: newFlow.to })) return;
                  startTransition(async () => {
                    setInlineError(null);
                  const response = await fetch("/api/quick/flow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ from: newFlow.from, to: newFlow.to }),
                  });
                  const result = await response.json();
                  if (!result.ok) {
                    setInlineError(result.error ?? "Unable to create flow");
                    return;
                  }
                  const createdFlow = result.flow as { id: string; from: string; to: string; slug: string };
                    setFlowsList((prev) => [...prev, createdFlow]);
                    onChange(createdFlow.id);
                    onCreated?.(createdFlow);
                    setNewFlow({ from: "", to: "" });
                    setShowInlineForm(false);
                    show("Flow created and available in the list.", "success");
                  });
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                data-inline="true"
              >
                Add flow
              </Button>
              {inlineError ? <p className="text-sm text-red-600">{inlineError}</p> : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
