"use client";

import { useMemo, useState, useTransition, useId } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { flowQuickSchema } from "@/lib/validation/flow";

type FlowOption = { id: string; from: string; to: string; slug: string };

type FlowMultiInputProps = {
  value: string[];
  onChange: (ids: string[]) => void;
  flows: FlowOption[];
  label?: string;
  allowInline?: boolean;
  onCreated?: (flow: FlowOption) => void;
};

const flowStations = ["INJECTION", "PAINT", "ASSEMBLY", "BONDING", "INSPECTION", "SILS", "CUSTOMER", "WAREHOUSE"];

export function FlowMultiInput({
  value,
  onChange,
  flows,
  label = "Flows",
  allowInline = true,
  onCreated,
}: FlowMultiInputProps) {
  const selectId = useId();
  const [flowsList, setFlowsList] = useState(flows);
  const [selectedId, setSelectedId] = useState("");
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

  const selectedFlows = value
    .map((id) => flowsList.find((f) => f.id === id))
    .filter((item): item is FlowOption => Boolean(item));

  const addFlow = (id: string) => {
    if (!id) return;
    if (value.includes(id)) {
      setSelectedId("");
      return;
    }
    onChange([...value, id]);
    setSelectedId("");
  };

  const removeFlow = (id: string) => {
    onChange(value.filter((flowId) => flowId !== id));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-smc-text" htmlFor={selectId}>{label}</label>
      <select
        id={selectId}
        className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
        value={selectedId}
        onChange={(e) => {
          const next = e.target.value;
          setSelectedId(next);
          addFlow(next);
        }}
      >
        <option value="">Select a flow</option>
        {flowsList.map((f) => (
          <option key={f.id} value={f.id}>{f.from} → {f.to}</option>
        ))}
      </select>

      {selectedFlows.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedFlows.map((flow) => (
            <div key={flow.id} className="flex items-center gap-2 rounded-lg border border-smc-border/70 bg-white px-2 py-1 text-sm">
              <span className="font-semibold text-smc-text">{flow.from} → {flow.to}</span>
              <button
                type="button"
                className="cursor-pointer text-red-600"
                onClick={(e) => {
                  e.preventDefault();
                  removeFlow(flow.id);
                }}
                aria-label={`Remove ${flow.from} to ${flow.to}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-smc-text-muted">No flow selected.</p>
      )}

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
                className="cursor-pointer"
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
                    const createdFlow = result.flow as FlowOption;
                    setFlowsList((prev) => [...prev, createdFlow]);
                    onChange(value.includes(createdFlow.id) ? value : [...value, createdFlow.id]);
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
