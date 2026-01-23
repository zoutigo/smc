"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConfirmMessage } from "@/components/ui/confirm-message";
import { CustomButton } from "@/components/ui/custom-button";
import { createTransportMeanNoteAction, type NoteActionState } from "../actions";

type NoteItem = {
  id: string;
  title?: string | null;
  content: string;
  createdAt: string;
};

type NotesSectionProps = {
  transportMeanId: string;
  slug: string;
  initialNotes: NoteItem[];
};

const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Note content is required"),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

export default function NotesSection({ transportMeanId, slug, initialNotes }: NotesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { show } = useConfirmMessage();
  const [state, setState] = useState<NoteActionState>({ status: "idle" });
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    mode: "onChange",
  });

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notes]
  );

  return (
    <div className="rounded-xl border border-smc-border/70 bg-white p-4 shadow-inner">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-smc-text">Notes</h3>
        <div className="flex items-center gap-2">
          {state.status === "error" && state.message ? (
            <span className="text-xs text-red-600">{state.message}</span>
          ) : null}
          <CustomButton
            text={showForm ? "Close" : "Add Note"}
            size="sm"
            onClick={() => setShowForm((prev) => !prev)}
            aria-expanded={showForm}
          />
        </div>
      </div>

      {showForm ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit((values) => {
            const fd = new FormData();
            fd.append("transportMeanId", transportMeanId);
            fd.append("slug", slug);
            fd.append("title", values.title);
            fd.append("content", values.content);
            startTransition(async () => {
              const result = await createTransportMeanNoteAction(state, fd);
              setState(result);
              if (result.status === "success" && result.note) {
                setNotes((prev) => [result.note!, ...prev]);
                setShowForm(false);
                reset();
                show("Note added", "success");
              }
            });
          })}
          className="mt-3 space-y-3 rounded-lg border border-dashed border-smc-border/60 bg-smc-bg/50 p-3"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-smc-text" htmlFor="transport-note-title">
              Title
              <span className="text-red-600"> *</span>
            </label>
            <input
              id="transport-note-title"
              type="text"
              {...register("title", { required: "Title is required" })}
              className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm"
              placeholder="Summary"
            />
            {errors.title ? <p className="text-xs text-red-600">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-smc-text" htmlFor="transport-note-content">
              Note
              <span className="text-red-600"> *</span>
            </label>
            <textarea
              id="transport-note-content"
              {...register("content", { required: "Note content is required" })}
              className="w-full rounded-md border border-smc-border/70 px-3 py-2 text-sm"
              rows={3}
              placeholder="Add your note..."
            />
            {errors.content ? <p className="text-xs text-red-600">{errors.content.message}</p> : null}
            {state.fieldErrors?.content ? (
              <p className="text-xs text-red-600">{state.fieldErrors.content}</p>
            ) : null}
            {state.fieldErrors?.title ? (
              <p className="text-xs text-red-600">{state.fieldErrors.title}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton text="Cancel" variant="ghost" size="sm" onClick={() => setShowForm(false)} />
            <CustomButton
              text={isPending ? "Saving..." : "Save note"}
              size="sm"
              type="submit"
              disabled={!isDirty || isSubmitting || isPending || Object.keys(errors).length > 0}
            />
          </div>
        </form>
      ) : null}

      <div className="mt-3 space-y-3">
        {sortedNotes.map((note) => (
          <div key={note.id} className="rounded-lg border border-smc-border/60 bg-smc-bg/30 p-3">
            {note.title ? <p className="text-sm font-semibold text-smc-text">{note.title}</p> : null}
            <p className="text-sm text-smc-text">{note.content}</p>
            <p className="mt-1 text-[11px] uppercase text-smc-text-muted">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
        {sortedNotes.length === 0 ? <p className="text-sm text-smc-text-muted">No notes yet.</p> : null}
      </div>
    </div>
  );
}
