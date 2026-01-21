"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { projectQuickSchema } from "@/lib/validation/project";

type Option = { id: string; name: string };

type ProjectInputProps = {
  value: string;
  onChange: (id: string) => void;
  projects: Option[];
  label?: string;
  required?: boolean;
  onCreated?: (project: Option) => void;
};

export function ProjectInput({ value, onChange, projects, label = "Project", required, onCreated }: ProjectInputProps) {
  const [projectList, setProjectList] = useState(projects);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { show } = useConfirmMessage();

  const validate = (payload: { name: string; code?: string }) => {
    const parsed = projectQuickSchema.safeParse(payload);
    if (!parsed.success) {
      setInlineError(parsed.error.issues[0]?.message ?? "Invalid project");
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
        <option value="">Select a project</option>
        {projectList.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <label className="mt-1 inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showInlineForm}
          onChange={(e) => setShowInlineForm(e.target.checked)}
        />
        Project not in the list
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
              validate({ name: next, code });
            }}
            placeholder="Project name"
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const next = e.target.value;
              setCode(next);
              validate({ name, code: next || undefined });
            }}
            placeholder="Code (optional)"
            className="w-full rounded-lg border border-smc-border/70 bg-smc-bg/60 px-2 py-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
          <Button
            type="button"
            size="sm"
            disabled={!name.trim() || isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const trimmedName = name.trim();
              const nextCode = code.trim() || undefined;
              if (!trimmedName) return;
              if (!validate({ name: trimmedName, code: nextCode })) return;
              startTransition(async () => {
                try {
                  const response = await fetch("/api/quick/project", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: trimmedName, code: nextCode }),
                  });
                  const result = await response.json();
                  if (!result.ok) {
                    const message = result.error ?? "Unable to create project";
                    setInlineError(message);
                    show(message, "error");
                    return;
                  }
                  const created = result.project as { id: string; name: string };
                  setProjectList((prev) => [...prev, created]);
                  onChange(created.id);
                  onCreated?.(created);
                  setName("");
                  setCode("");
                  setShowInlineForm(false);
                  show("Project created and available in the list.", "success");
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : "Unable to create project";
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
