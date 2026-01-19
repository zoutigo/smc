"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
  error?: string | null;
};

export function PriceInput({ value, onChange, error }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-smc-text">Price</label>
      <input
        type="number"
        className="mt-1 w-full rounded-lg border border-smc-border/80 px-3 py-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder="0"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
