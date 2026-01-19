"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
};

export function DescriptionInput({ value, onChange, error }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-smc-text">Description</label>
      <textarea
        className="mt-1 w-full resize-none rounded-lg border border-smc-border/80 px-3 py-2"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What makes this storage mean unique?"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
