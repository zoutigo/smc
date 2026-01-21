"use client";

import React from "react";

export type StepItem = {
  key: string;
  label: string;
  description?: React.ReactNode;
  body: React.ReactNode;
  guidance?: React.ReactNode;
  footer?: React.ReactNode;
};

type MeanMultistepFormProps = {
  heroTitle: string;
  heroSubtitle: string;
  modeLabel: string;
  steps: StepItem[];
  currentIndex: number; // zero-based
};

const StepBanner = ({ steps, currentIndex }: { steps: StepItem[]; currentIndex: number }) => {
  return (
    <div className="flex w-full items-center gap-2">
      {steps.map((step, idx) => {
        const status = idx < currentIndex ? "done" : idx === currentIndex ? "current" : "next";
        const color =
          status === "done"
            ? "bg-emerald-500 text-white"
            : status === "current"
            ? "bg-amber-500 text-white"
            : "bg-transparent text-smc-text border border-smc-border/70";
        return (
          <div
            key={step.key}
            className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide ${color}`}
          >
            {step.label}
          </div>
        );
      })}
    </div>
  );
};

export function MeanMultistepForm({ heroTitle, heroSubtitle, modeLabel, steps, currentIndex }: MeanMultistepFormProps) {
  const current = steps[currentIndex] ?? steps[0];

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border border-smc-border/60 px-4 py-4 shadow-inner"
        style={{
          background: "linear-gradient(180deg, rgb(var(--smc-secondary) / 0.35) 0%, rgb(var(--smc-secondary) / 0.18) 60%, rgb(var(--smc-secondary) / 0.10) 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-smc-text">{heroTitle}</h2>
          <span className="text-xs rounded-full bg-smc-secondary/25 px-3 py-1 font-semibold text-smc-text">
            {modeLabel}
          </span>
        </div>
        <p className="text-sm text-smc-text-muted">{heroSubtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[4fr_1fr]">
        <div className="space-y-3">
          <div className="rounded-xl bg-smc-primary/15 p-3 shadow-inner">
            <StepBanner steps={steps} currentIndex={currentIndex} />
            <div className="mt-2 text-xs text-smc-text-muted">{current.description ?? current.label}</div>
          </div>
          {current.body}
          {current.footer}
        </div>
        <aside className="rounded-2xl border border-smc-border/70 bg-smc-bg/70 p-4 shadow-inner">
          {current.guidance}
        </aside>
      </div>
    </div>
  );
}
