import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  secondary: string;
  trend: number;
  trendSuffix?: string;
  positive: boolean;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger" | "success";
};

const metricTones = {
  default: "bg-primary/8 text-primary",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function MetricCard({
  label,
  value,
  secondary,
  trend,
  trendSuffix = "%",
  positive,
  icon: Icon,
  tone = "default",
}: MetricCardProps) {
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;

  return (
    <Card className="gap-0 border-border/75 py-0 shadow-[0_1px_2px_0_rgb(15_23_42/0.025)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("flex size-9 items-center justify-center rounded-lg", metricTones[tone])}>
            <Icon className="size-[1.05rem]" />
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[0.68rem] font-semibold tabular-nums",
              positive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            )}
          >
            <TrendIcon className="size-3" />
            {Math.abs(trend).toFixed(1)}{trendSuffix}
          </span>
        </div>
        <p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-[1.65rem] font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{secondary}</p>
      </CardContent>
    </Card>
  );
}

type StatusBadgeProps = {
  status: "critical" | "high" | "medium" | "healthy";
  children?: ReactNode;
};

const statusStyles = {
  critical:
    "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  high: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  medium:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  healthy:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[0.64rem] font-semibold capitalize",
        statusStyles[status]
      )}
    >
      {children ?? status}
    </Badge>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
