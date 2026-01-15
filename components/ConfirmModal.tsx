"use client";

import React, { useState, cloneElement, ReactElement } from "react";
import { Button } from "@/components/ui/button";

type TriggerProps = {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  [key: string]: unknown;
};

export type ConfirmModalProps = {
  trigger: ReactElement<TriggerProps>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmModal({
  trigger,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    setOpen(false);
  };

  const clonedTrigger = cloneElement(trigger, {
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      trigger.props.onClick?.(event);
      event.preventDefault();
      setOpen(true);
    },
    "aria-haspopup": "dialog",
  } satisfies TriggerProps);

  return (
    <>
      {clonedTrigger}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={handleCancel}
          data-testid="confirm-modal-overlay"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-description"
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description ? (
              <p id="confirm-modal-description" className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={submitting}>
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={destructive ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={submitting}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
