"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
};

export function SopInput({ value, onChange, error }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-smc-text">SOP</label>
      <input
        type="date"
        className="mt-1 w-full rounded-lg border border-smc-border/80 bg-smc-bg/60 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
