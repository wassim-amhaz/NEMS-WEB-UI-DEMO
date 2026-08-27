import { useMemo } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  ShieldAlert,
  Sparkles,
  TimerReset,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

import { useBranch } from "@/components/nems/branch-context";
import {
  MetricCard,
  SectionHeader,
  StatusBadge,
} from "@/components/nems/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import {
  getBranchDashboard,
  type AttentionItem,
  type AttentionWindow,
  type RankedLossProduct,
} from "@/mock/dashboard";
import { MultiBranchCommandCenter } from "./multi-branch";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const number = new Intl.NumberFormat("en-US");

const attentionConfig: Array<{
  key: AttentionWindow;
  label: string;
  hint: string;
  dotClassName: string;
  countClassName: string;
}> = [
  {
    key: "overdue",
    label: "Overdue",
    hint: "Immediate removal",
    dotClassName: "bg-red-500",
    countClassName: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  {
    key: "today",
    label: "Today",
    hint: "Due before close",
    dotClassName: "bg-amber-500",
    countClassName: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    key: "next3",
    label: "Next 3 Days",
    hint: "Prepare action",
    dotClassName: "bg-sky-500",
    countClassName: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  {
    key: "next7",
    label: "Next 7 Days",
    hint: "Plan capacity",
    dotClassName: "bg-violet-500",
    countClassName: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
];

const chartConfig = {
  value: { label: "Loss value", color: "var(--chart-1)" },
  fifo: { label: "FIFO", color: "var(--chart-1)" },
  expiry: { label: "Expiry", color: "var(--chart-5)" },
  early: { label: "Early-Removal Loss", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function OverviewPage() {
  const { isAllBranches } = useBranch();

  return isAllBranches ? (
    <MultiBranchCommandCenter />
  ) : (
    <BranchCommandCenter />
  );
}

export function BranchCommandCenter() {
  const { selectedBranch } = useBranch();
  const dashboard = useMemo(
    () => getBranchDashboard(selectedBranch.id),
    [selectedBranch.id]
  );
  const { metrics } = dashboard;
  const attentionCount = Object.values(dashboard.attention).reduce(
    (total, items) => total + items.length,
    0
  );

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">
              Branch Command Center
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-primary/20 bg-primary/5 text-[0.66rem] text-primary"
            >
              Branch operating view
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {selectedBranch.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {selectedBranch.code} · {selectedBranch.region} · Managed by {selectedBranch.manager}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5">
            <PackageCheck className="size-3.5 text-primary" />
            {dashboard.trackedProductCount} tracked products
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5">
            <Clock3 className="size-3.5 text-amber-600 dark:text-amber-400" />
            {dashboard.openActionCount} open actions
          </span>
          <span className="inline-flex items-center gap-1.5 px-1.5">
            Updated 08:42
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="FIFO Loss Rate"
          value={`${metrics.fifoLossRate.toFixed(2)}%`}
          secondary={`${number.format(metrics.fifoUnits)} confirmed lost units`}
          trend={metrics.fifoDelta}
          positive={metrics.fifoDelta < 0}
          icon={TrendingDown}
          tone="danger"
        />
        <MetricCard
          label="Expiry Loss"
          value={currency.format(metrics.expiryLoss)}
          secondary={`${number.format(metrics.expiryUnits)} units · previous 30 days`}
          trend={metrics.expiryDelta}
          positive={metrics.expiryDelta < 0}
          icon={CalendarClock}
          tone="warning"
        />
        <MetricCard
          label="Estimated Avoidable Loss"
          value={currency.format(metrics.avoidableLoss)}
          secondary="FIFO, early removal, and preventable expiry"
          trend={metrics.avoidableDelta}
          positive={metrics.avoidableDelta < 0}
          icon={CircleDollarSign}
          tone="danger"
        />
        <MetricCard
          label="Removal Compliance"
          value={`${metrics.removalCompliance.toFixed(1)}%`}
          secondary="Batches removed on or before target"
          trend={metrics.removalDelta}
          trendSuffix=" pp"
          positive={metrics.removalDelta > 0}
          icon={PackageCheck}
          tone="success"
        />
        <MetricCard
          label="Action Compliance"
          value={`${metrics.actionCompliance.toFixed(1)}%`}
          secondary={`${dashboard.openActionCount} actions currently open`}
          trend={metrics.actionDelta}
          trendSuffix=" pp"
          positive={metrics.actionDelta > 0}
          icon={ClipboardCheck}
          tone="success"
        />
        <MetricCard
          label="Current Expiry Exposure"
          value={currency.format(metrics.expiryExposure)}
          secondary={`${number.format(metrics.exposureUnits)} units at risk within 14 days`}
          trend={metrics.exposureDelta}
          positive={metrics.exposureDelta < 0}
          icon={ShieldAlert}
          tone="warning"
        />
      </div>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <SectionHeader
            title="Removal Attention"
            description="Tracked batches grouped by operational removal window."
            action={
              <Badge variant="secondary" className="rounded-md tabular-nums">
                {attentionCount} batches
              </Badge>
            }
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {attentionConfig.map(({ key, ...config }) => (
              <AttentionColumn
                key={key}
                {...config}
                items={dashboard.attention[key]}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <LossRankingCard
          title="Top FIFO Loss Products"
          description="Ranked by confirmed FIFO loss value in the last 30 days."
          items={dashboard.topFifoLoss}
          accent="fifo"
        />
        <LossRankingCard
          title="Top Expiry Loss Products"
          description="Products driving recurring expiry loss in the branch."
          items={dashboard.topExpiryLoss}
          accent="expiry"
        />

        <div className="grid gap-5">
          <AvoidableLossCard data={dashboard.avoidableLoss} />
          <LossBreakdownCard data={dashboard.lossBreakdown} />
        </div>
      </div>
    </section>
  );
}

type AttentionColumnProps = Omit<(typeof attentionConfig)[number], "key"> & {
  items: AttentionItem[];
};

function AttentionColumn({
  label,
  hint,
  dotClassName,
  countClassName,
  items,
}: AttentionColumnProps) {
  return (
    <div className="min-w-0 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", dotClassName)} />
          <div>
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[0.67rem] text-muted-foreground">{hint}</p>
          </div>
        </div>
        <span
          className={cn(
            "flex min-w-6 items-center justify-center rounded-md px-1.5 py-1 text-[0.68rem] font-semibold tabular-nums",
            countClassName
          )}
        >
          {items.length}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.batch.id}
            className="rounded-lg border border-border/70 bg-background/70 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-1 text-xs font-medium">
                {item.product.name}
              </p>
              <span className="shrink-0 text-[0.67rem] font-semibold tabular-nums">
                {currency.format(item.valueAtRisk)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[0.66rem] text-muted-foreground">
              <span>
                {item.batch.lotNumber} · {item.batch.unitsOnHand} units
              </span>
              <span
                className={cn(
                  "font-medium",
                  item.daysUntilRemoval < 0
                    ? "text-red-600 dark:text-red-400"
                    : item.daysUntilRemoval === 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground/70"
                )}
              >
                {item.daysUntilRemoval < 0
                  ? `${Math.abs(item.daysUntilRemoval)}d late`
                  : item.daysUntilRemoval === 0
                    ? "Due today"
                    : `In ${item.daysUntilRemoval}d`}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-7 text-center text-xs text-muted-foreground">
            No batches in this window
          </div>
        ) : null}
        {items.length > 3 ? (
          <p className="pt-1 text-center text-xs text-muted-foreground">
            +{items.length - 3} additional batches
          </p>
        ) : null}
      </div>
    </div>
  );
}

type LossRankingCardProps = {
  title: string;
  description: string;
  items: RankedLossProduct[];
  accent: "fifo" | "expiry";
};

function LossRankingCard({
  title,
  description,
  items,
  accent,
}: LossRankingCardProps) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title={title}
          description={description}
          action={
            accent === "fifo" ? (
              <TimerReset className="size-4 text-red-500" />
            ) : (
              <AlertTriangle className="size-4 text-amber-500" />
            )
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item, index) => (
            <div key={item.product.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[0.68rem] font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-medium">{item.product.name}</p>
                  <StatusBadge status={item.severity} />
                </div>
                <p className="mt-1 text-[0.67rem] text-muted-foreground">
                  {item.events} events · {item.velocityLabel} velocity ({item.velocity.toFixed(1)}/day)
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold tabular-nums">
                  {currency.format(item.value)}
                </p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[0.66rem] text-muted-foreground">
                  <span>{item.units} units</span>
                  <span>·</span>
                  <span
                    className={cn(
                      "inline-flex items-center",
                      item.trendPercent <= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {item.trendPercent <= 0 ? (
                      <TrendingDown className="mr-0.5 size-3" />
                    ) : (
                      <TrendingUp className="mr-0.5 size-3" />
                    )}
                    {Math.abs(item.trendPercent)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type AvoidableLossCardProps = {
  data: {
    fifo: number;
    earlyRemoval: number;
    preventableExpiry: number;
    total: number;
  };
};

function AvoidableLossCard({ data }: AvoidableLossCardProps) {
  const items = [
    { label: "FIFO-caused loss", value: data.fifo, className: "bg-red-500" },
    {
      label: "Early-removal loss",
      value: data.earlyRemoval,
      className: "bg-violet-500",
    },
    {
      label: "Preventable Expiry Loss",
      value: data.preventableExpiry,
      className: "bg-amber-500",
    },
  ];

  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title="Avoidable Loss"
          description="Estimated recoverable value by root cause."
          action={<Sparkles className="size-4 text-primary" />}
        />
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Total opportunity
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {currency.format(data.total)}
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-md border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          >
            30-day view
          </Badge>
        </div>
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const share = (item.value / Math.max(data.total, 1)) * 100;
            return (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold tabular-nums">
                    {currency.format(item.value)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", item.className)}
                    style={{ width: `${Math.max(share, 5)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

type LossBreakdownCardProps = {
  data: Array<{
    key: "fifo" | "expiry" | "early-removal";
    label: string;
    value: number;
    units: number;
  }>;
};

function LossBreakdownCard({ data }: LossBreakdownCardProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill:
      item.key === "fifo"
        ? "var(--color-fifo)"
        : item.key === "expiry"
          ? "var(--color-expiry)"
          : "var(--color-early)",
  }));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title="Loss Breakdown"
          description="Confirmed loss value by cause."
          action={<Banknote className="size-4 text-muted-foreground" />}
        />
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Total confirmed</span>
          <span className="text-sm font-semibold tabular-nums">
            {compactCurrency.format(total)}
          </span>
        </div>
        <ChartContainer config={chartConfig} className="h-[150px] w-full aspect-auto">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              axisLine={false}
              tickLine={false}
              width={82}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.45 }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={18}>
              {chartData.map((item) => (
                <Cell key={item.key} fill={item.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {data.map((item) => (
            <div key={item.key} className="rounded-md bg-muted/55 px-2 py-2 text-center">
              <p className="text-[0.62rem] text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-[0.7rem] font-semibold tabular-nums">
                {item.units} units
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
