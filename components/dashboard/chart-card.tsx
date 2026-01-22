import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function ChartCard({ title, description, className, children }: ChartCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-smc-text">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-sm text-smc-textMuted">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="h-[280px] pt-0">{children}</CardContent>
    </Card>
  );
}
