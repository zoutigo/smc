import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricTileProps = {
  label: string;
  value: string;
  helper?: string;
  className?: string;
};

export function MetricTile({ label, value, helper, className }: MetricTileProps) {
  return (
    <Card className={cn("px-5 py-4", className)}>
      <p className="text-sm text-smc-textMuted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-smc-primary">{value}</p>
      {helper ? <p className="text-xs text-smc-textMuted mt-1">{helper}</p> : null}
    </Card>
  );
}
