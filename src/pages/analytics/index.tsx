import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Lightbulb,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceArea,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { ALL_BRANCHES_ID, useBranch } from "@/components/nems/branch-context";
import { MetricCard, SectionHeader } from "@/components/nems/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  analyticsCategories,
  analyticsSuppliers,
  EXPIRY_LOSS_ATTENTION_THRESHOLD,
  getAnalyticsData,
  VELOCITY_EXPLANATION_THRESHOLD,
  type AnalyticsDirection,
  type AnalyticsFilters,
  type AnalyticsRange,
  type VelocityExpiryPoint,
} from "@/mock/analytics";
import { branches } from "@/mock/nems-data";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const lossChartConfig = {
  fifo: { label: "FIFO Loss", color: "var(--chart-1)" },
  expiry: { label: "Expiry Loss", color: "var(--chart-2)" },
  avoidable: { label: "Avoidable Loss", color: "var(--chart-4)" },
} satisfies ChartConfig;

const complianceChartConfig = {
  removal: { label: "Removal Compliance", color: "var(--chart-1)" },
  action: { label: "Action Compliance", color: "var(--chart-3)" },
} satisfies ChartConfig;

const compositionChartConfig = {
  fifo: { label: "Confirmed FIFO", color: "var(--chart-1)" },
  expiry: { label: "Expiry Loss", color: "var(--chart-2)" },
  "preventable-expiry": {
    label: "Preventable Expiry",
    color: "var(--chart-4)",
  },
  "early-removal": { label: "Early Removal", color: "var(--chart-5)" },
} satisfies ChartConfig;

const scatterChartConfig = {
  expiryLoss: { label: "Expiry Loss", color: "var(--chart-2)" },
  velocity: { label: "Sales Velocity", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function AnalyticsPage() {
  const { selectedBranchId, setSelectedBranchId, isAllBranches } = useBranch();
  const [filters, setFilters] = useAnalyticsFilters(selectedBranchId);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      branchId: selectedBranchId,
    }));
  }, [selectedBranchId, setFilters]);

  const data = useMemo(() => getAnalyticsData(filters), [filters]);
  const compositionTotal = data.composition.reduce(
    (total, item) => total + item.value,
    0
  );
  const rangeLabel = rangeLabels[filters.rangeDays];
  const scatterMaxVelocity = Math.max(
    VELOCITY_EXPLANATION_THRESHOLD + 2,
    ...data.velocityExpiry.map((point) => point.velocity * 1.08)
  );
  const scatterMaxExpiry = Math.max(
    EXPIRY_LOSS_ATTENTION_THRESHOLD + 25,
    ...data.velocityExpiry.map((point) => point.expiryLoss * 1.08)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <BarChart3 className="size-4 text-primary" />
            Intelligence
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Historical loss, exposure, and execution performance for{" "}
            {data.contextLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={filters.branchId}
            onValueChange={(branchId) => {
              setFilters((current) => ({ ...current, branchId }));
              setSelectedBranchId(branchId);
            }}
            className="w-full sm:w-52"
            options={[
              { value: ALL_BRANCHES_ID, label: "All Branches" },
              ...branches.map((branch) => ({
                value: branch.id,
                label: branch.name,
              })),
            ]}
          />
          <FilterSelect
            value={String(filters.rangeDays)}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                rangeDays: Number(value) as AnalyticsRange,
              }))
            }
            options={[
              { value: "7", label: "7 Days" },
              { value: "30", label: "30 Days" },
              { value: "90", label: "90 Days" },
              { value: "180", label: "6 Months" },
            ]}
          />
        </div>
      </div>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
          <span className="mr-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Analysis scope
          </span>
          <FilterSelect
            value={filters.categoryId}
            onValueChange={(categoryId) =>
              setFilters((current) => ({ ...current, categoryId }))
            }
            options={[
              { value: "all", label: "All Categories" },
              ...analyticsCategories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
          <FilterSelect
            value={filters.supplierId}
            onValueChange={(supplierId) =>
              setFilters((current) => ({ ...current, supplierId }))
            }
            options={[
              { value: "all", label: "All Suppliers" },
              ...analyticsSuppliers.map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              })),
            ]}
          />
          <FilterSelect
            value={filters.lossType}
            onValueChange={(lossType) =>
              setFilters((current) => ({
                ...current,
                lossType: lossType as AnalyticsFilters["lossType"],
              }))
            }
            options={[
              { value: "all", label: "All Loss Types" },
              { value: "fifo", label: "FIFO Loss" },
              { value: "expiry", label: "Expiry Loss" },
              { value: "early-removal", label: "Early Removal" },
            ]}
          />
          {(filters.categoryId !== "all" ||
            filters.supplierId !== "all" ||
            filters.lossType !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  categoryId: "all",
                  supplierId: "all",
                  lossType: "all",
                }))
              }
            >
              Reset filters
            </Button>
          )}
          <Badge variant="outline" className="ml-auto rounded-md">
            Tracked products only
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="FIFO Loss"
          value={currency.format(data.metrics.fifoLoss)}
          secondary={`vs previous ${rangeLabel.toLowerCase()}`}
          trend={data.metrics.fifoDelta}
          positive={data.metrics.fifoDelta <= 0}
          icon={TrendingDown}
          tone={data.metrics.fifoDelta > 3 ? "danger" : "default"}
        />
        <MetricCard
          label="Expiry Loss"
          value={currency.format(data.metrics.expiryLoss)}
          secondary={`vs previous ${rangeLabel.toLowerCase()}`}
          trend={data.metrics.expiryDelta}
          positive={data.metrics.expiryDelta <= 0}
          icon={AlertTriangle}
          tone={data.metrics.expiryDelta > 5 ? "danger" : "warning"}
        />
        <MetricCard
          label="Avoidable Loss"
          value={currency.format(data.metrics.avoidableLoss)}
          secondary="Estimated preventable value"
          trend={data.metrics.avoidableDelta}
          positive={data.metrics.avoidableDelta <= 0}
          icon={CircleDollarSign}
          tone="warning"
        />
        <MetricCard
          label="Removal Compliance"
          value={`${data.metrics.removalCompliance.toFixed(1)}%`}
          secondary="Percentage-point comparison"
          trend={data.metrics.removalDelta}
          trendSuffix=" pts"
          positive={data.metrics.removalDelta >= 0}
          icon={TimerReset}
          tone={data.metrics.removalCompliance >= 90 ? "success" : "warning"}
        />
        <MetricCard
          label="Action Compliance"
          value={`${data.metrics.actionCompliance.toFixed(1)}%`}
          secondary="Percentage-point comparison"
          trend={data.metrics.actionDelta}
          trendSuffix=" pts"
          positive={data.metrics.actionDelta >= 0}
          icon={ShieldCheck}
          tone={data.metrics.actionCompliance >= 90 ? "success" : "warning"}
        />
        <MetricCard
          label="Expiry Exposure"
          value={currency.format(data.metrics.expiryExposure)}
          secondary="Current amount at risk"
          trend={data.metrics.exposureDelta}
          positive={data.metrics.exposureDelta <= 0}
          icon={Gauge}
          tone="default"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
        <AnalyticsChartCard
          title="Loss Trend"
          description="FIFO, expiry, and estimated avoidable loss across the selected period."
          action={<Badge variant="outline">{rangeLabel}</Badge>}
        >
          <ChartContainer
            config={lossChartConfig}
            className="h-[330px] w-full aspect-auto"
          >
            <AreaChart
              data={data.lossTrend}
              margin={{ left: 0, right: 10, top: 8 }}
            >
              <defs>
                <linearGradient id="fifoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-fifo)"
                    stopOpacity={0.24}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-fifo)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="expiryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-expiry)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-expiry)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                width={58}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="fifo"
                stroke="var(--color-fifo)"
                fill="url(#fifoFill)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expiry"
                stroke="var(--color-expiry)"
                fill="url(#expiryFill)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="avoidable"
                stroke="var(--color-avoidable)"
                strokeWidth={2}
                dot={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Compliance Trend"
          description="Removal and action completion performance over time."
          action={<ShieldCheck className="size-4 text-muted-foreground" />}
        >
          <ChartContainer
            config={complianceChartConfig}
            className="h-[330px] w-full aspect-auto"
          >
            <LineChart
              data={data.complianceTrend}
              margin={{ left: 0, right: 14, top: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis
                domain={[50, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                width={44}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="removal"
                stroke="var(--color-removal)"
                strokeWidth={2.25}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="action"
                stroke="var(--color-action)"
                strokeWidth={2.25}
                dot={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </AnalyticsChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.5fr)]">
        <AnalyticsChartCard
          title="Loss Composition"
          description="How the scoped loss value is distributed by operational cause."
          action={<CircleDollarSign className="size-4 text-muted-foreground" />}
        >
          {compositionTotal > 0 ? (
            <div className="grid items-center gap-3 sm:grid-cols-[1fr_0.9fr]">
              <ChartContainer
                config={compositionChartConfig}
                className="mx-auto h-[230px] w-full max-w-[270px] aspect-square"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={data.composition}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={62}
                    outerRadius={88}
                    strokeWidth={2}
                  >
                    {data.composition.map((item) => (
                      <Cell key={item.key} fill={`var(--color-${item.key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="space-y-3">
                {data.composition.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: `var(--color-${item.key})` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums">
                      {currency.format(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyAnalysis message="No loss composition exists for the selected filters." />
          )}
        </AnalyticsChartCard>

        <Card className="gap-0 border-border/75 py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <SectionHeader
              title="Management Insights"
              description="Deterministic signals drawn from the current performance profile."
              action={<Lightbulb className="size-4 text-amber-500" />}
            />
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {data.insights.map((insight) => (
              <div key={insight.title} className="rounded-xl border p-4">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    insight.kind === "improving"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  )}
                >
                  {insight.kind === "improving" ? (
                    <Sparkles className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                </span>
                <p className="mt-3 text-sm font-semibold">{insight.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {insight.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {isAllBranches ? (
        <BranchComparison rows={data.branchPerformance} />
      ) : (
        <CategoryAnalysis rows={data.categoryPerformance} />
      )}

      <TopLossDrivers rows={data.topDrivers} />

      <AnalyticsChartCard
        title="Sales Velocity vs Expiry Loss"
        description="High confirmed expiry loss requires attention at any velocity; velocity explains the likely operating cause."
        action={
          <Badge variant="outline">
            High expiry = attention at any velocity
          </Badge>
        }
      >
        {data.velocityExpiry.length ? (
          <>
            <ChartContainer
              config={scatterChartConfig}
              className="h-[360px] w-full aspect-auto"
            >
              <ScatterChart
                margin={{ left: 4, right: 18, top: 12, bottom: 12 }}
              >
                <CartesianGrid />
                <ReferenceArea
                  x1={0}
                  x2={VELOCITY_EXPLANATION_THRESHOLD}
                  y1={EXPIRY_LOSS_ATTENTION_THRESHOLD}
                  y2={scatterMaxExpiry}
                  fill="var(--chart-4)"
                  fillOpacity={0.07}
                />
                <ReferenceArea
                  x1={VELOCITY_EXPLANATION_THRESHOLD}
                  x2={scatterMaxVelocity}
                  y1={EXPIRY_LOSS_ATTENTION_THRESHOLD}
                  y2={scatterMaxExpiry}
                  fill="var(--destructive)"
                  fillOpacity={0.055}
                />
                <ReferenceArea
                  x1={VELOCITY_EXPLANATION_THRESHOLD}
                  x2={scatterMaxVelocity}
                  y1={0}
                  y2={EXPIRY_LOSS_ATTENTION_THRESHOLD}
                  fill="var(--chart-2)"
                  fillOpacity={0.025}
                />
                <XAxis
                  type="number"
                  dataKey="velocity"
                  name="Sales Velocity"
                  unit="/day"
                  domain={[0, scatterMaxVelocity]}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString("en-US", {
                      maximumFractionDigits: 1,
                    })
                  }
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Sales velocity (units/day)",
                    position: "insideBottom",
                    offset: -8,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="expiryLoss"
                  name="Expiry Loss"
                  domain={[0, scatterMaxExpiry]}
                  tickFormatter={(value) => currency.format(Number(value))}
                  tickLine={false}
                  axisLine={false}
                  width={58}
                />
                <ZAxis range={[70, 170]} />
                <ChartTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<VelocityExpiryTooltip />}
                />
                <Scatter
                  data={data.velocityExpiry}
                  fill="var(--color-expiryLoss)"
                  isAnimationActive={false}
                >
                  {data.velocityExpiry.map((point) => (
                    <Cell
                      key={point.id}
                      fill={scatterZoneColors[point.zone]}
                      fillOpacity={
                        point.zone === "healthy" || point.zone === "monitor"
                          ? 0.72
                          : 0.92
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="name"
                    content={(labelProps) => (
                      <ScatterProductLabel
                        x={labelProps.x}
                        y={labelProps.y}
                        index={labelProps.index}
                        points={data.velocityExpiry}
                        maxVelocity={scatterMaxVelocity}
                        maxExpiry={scatterMaxExpiry}
                      />
                    )}
                  />
                </Scatter>
              </ScatterChart>
            </ChartContainer>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {scatterZoneLegend.map((zone) => (
                <div
                  key={zone.label}
                  className="flex items-start gap-2 rounded-lg border bg-muted/15 p-3"
                >
                  <span
                    className="mt-1 size-2 shrink-0 rounded-full"
                    style={{ background: zone.color }}
                  />
                  <div>
                    <p className="text-[0.68rem] font-semibold">{zone.label}</p>
                    <p className="mt-1 text-[0.64rem] leading-4 text-muted-foreground">
                      {zone.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyAnalysis message="No expiry-loss products match the selected filters." />
        )}
      </AnalyticsChartCard>
    </div>
  );
}

function useAnalyticsFilters(selectedBranchId: string) {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    branchId: selectedBranchId,
    rangeDays: 30,
    categoryId: "all",
    supplierId: "all",
    lossType: "all",
  });
  return [filters, setFilters] as const;
}

function AnalyticsChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title={title}
          description={description}
          action={action}
        />
      </CardHeader>
      <CardContent className="px-3 pb-4 pt-4 sm:px-5">{children}</CardContent>
    </Card>
  );
}

function BranchComparison({
  rows,
}: {
  rows: ReturnType<typeof getAnalyticsData>["branchPerformance"];
}) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <SectionHeader
          title="Branch Performance"
          description="Comparative loss and execution performance across the network."
          action={<Boxes className="size-4 text-muted-foreground" />}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Branch</TableHead>
              <TableHead className="text-right">FIFO Loss</TableHead>
              <TableHead className="text-right">Expiry Loss</TableHead>
              <TableHead className="text-right">Avoidable</TableHead>
              <TableHead className="text-right">Removal</TableHead>
              <TableHead className="text-right">Actions</TableHead>
              <TableHead className="pr-5 text-right">
                Performance Trend
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.branch.id}>
                <TableCell className="pl-5">
                  <p className="text-xs font-semibold">{row.branch.name}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    {row.branch.code}
                  </p>
                </TableCell>
                <TableCell className="text-right text-xs font-medium tabular-nums">
                  {currency.format(row.fifoLoss)}
                </TableCell>
                <TableCell className="text-right text-xs font-medium tabular-nums">
                  {currency.format(row.expiryLoss)}
                </TableCell>
                <TableCell className="text-right text-xs font-medium tabular-nums">
                  {currency.format(row.avoidableLoss)}
                </TableCell>
                <TableCell className="text-right text-xs font-medium tabular-nums">
                  {row.removalCompliance.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right text-xs font-medium tabular-nums">
                  {row.actionCompliance.toFixed(1)}%
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <PerformanceTrendBadge
                    direction={row.direction}
                    trend={row.trend}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PerformanceTrendBadge({
  direction,
  trend,
}: {
  direction: AnalyticsDirection;
  trend: number;
}) {
  const Icon =
    direction === "improving"
      ? ArrowUp
      : direction === "deteriorating"
      ? ArrowDown
      : ArrowRight;
  const magnitude = Math.abs(trend).toFixed(1);
  const tooltip =
    direction === "improving"
      ? `Combined operational performance improved ${magnitude}% vs previous period.`
      : direction === "deteriorating"
      ? `Combined operational performance declined ${magnitude}% vs previous period.`
      : `Combined operational performance remained stable with ${magnitude}% net movement vs previous period.`;

  return (
    <Badge
      variant="outline"
      title={tooltip}
      aria-label={tooltip}
      className={cn(
        "gap-1 rounded-md text-[0.64rem] capitalize",
        direction === "improving"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : direction === "deteriorating"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {direction} {magnitude}%
    </Badge>
  );
}

function CategoryAnalysis({
  rows,
}: {
  rows: ReturnType<typeof getAnalyticsData>["categoryPerformance"];
}) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <SectionHeader
          title="Category Loss Performance"
          description="Loss concentration and direction inside the selected branch."
          action={<PackageSearch className="size-4 text-muted-foreground" />}
        />
      </CardHeader>
      <CardContent className="p-0">
        {rows.length ? (
          <div className="grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {rows.slice(0, 6).map((row, index) => (
              <div key={row.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[0.68rem] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{row.name}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    {row.productCount} tracked products · FIFO{" "}
                    {currency.format(row.fifoLoss)} · Expiry{" "}
                    {currency.format(row.expiryLoss)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {currency.format(row.totalLoss)}
                  </p>
                  <DirectionBadge
                    direction={row.direction}
                    trend={row.trend}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyAnalysis message="No category loss exists for the selected filters." />
        )}
      </CardContent>
    </Card>
  );
}

function TopLossDrivers({
  rows,
}: {
  rows: ReturnType<typeof getAnalyticsData>["topDrivers"];
}) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <SectionHeader
          title="Top Loss Drivers"
          description="Tracked products responsible for the largest confirmed loss value."
          action={<TrendingDown className="size-4 text-muted-foreground" />}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length ? (
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Product</TableHead>
                <TableHead className="text-right">Total Loss</TableHead>
                <TableHead className="text-right">FIFO</TableHead>
                <TableHead className="text-right">Expiry</TableHead>
                <TableHead className="text-right">Early Removal</TableHead>
                <TableHead className="text-right">Velocity</TableHead>
                <TableHead>Primary Driver</TableHead>
                <TableHead className="pr-5 text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.product.id}>
                  <TableCell className="pl-5">
                    <Link
                      to={`/products/${row.product.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span className="flex size-7 items-center justify-center rounded-md bg-muted text-[0.68rem] font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold group-hover:text-primary">
                          {row.product.name}
                        </p>
                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                          {row.product.sku}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-xs font-semibold tabular-nums">
                    {currency.format(row.totalLoss)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {currency.format(row.fifoLoss)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {currency.format(row.expiryLoss)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {currency.format(row.earlyRemovalLoss)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {row.velocity.toFixed(1)}/day
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="rounded-md text-[0.64rem]"
                    >
                      {row.primaryDriver}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DirectionBadge
                      direction={row.direction}
                      trend={row.trend}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyAnalysis message="No tracked loss drivers match the selected filters." />
        )}
      </CardContent>
    </Card>
  );
}

function DirectionBadge({
  direction,
  trend,
  compact = false,
}: {
  direction: AnalyticsDirection;
  trend: number;
  compact?: boolean;
}) {
  const Icon =
    direction === "improving"
      ? ArrowDownRight
      : direction === "deteriorating"
      ? ArrowUpRight
      : CheckCircle2;
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md gap-1 text-[0.64rem] capitalize",
        direction === "improving"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : direction === "deteriorating"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-muted text-muted-foreground",
        compact && "mt-1"
      )}
    >
      <Icon className="size-3" />
      {compact
        ? `${Math.abs(trend).toFixed(1)}%`
        : `${direction} ${Math.abs(trend).toFixed(1)}%`}
    </Badge>
  );
}

function FilterSelect({
  value,
  onValueChange,
  options,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full sm:w-44", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyAnalysis({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
      <BarChart3 className="size-6 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Adjust the analytics scope to compare another tracked segment.
      </p>
    </div>
  );
}

function ScatterProductLabel({
  x,
  y,
  index,
  points,
  maxVelocity,
  maxExpiry,
}: {
  x?: string | number;
  y?: string | number;
  index?: number;
  points: VelocityExpiryPoint[];
  maxVelocity: number;
  maxExpiry: number;
}) {
  const pointIndex = index ?? 0;
  const point = points[pointIndex];
  if (!point) return null;
  const important = point.expiryLoss >= EXPIRY_LOSS_ATTENTION_THRESHOLD;
  const { offsetY, placeRight } = getScatterLabelPlacement(
    pointIndex,
    points,
    maxVelocity,
    maxExpiry
  );
  const compactName = truncateProductName(point.name, important ? 21 : 16);

  return (
    <text
      x={Number(x ?? 0) + (placeRight ? 7 : -7)}
      y={Number(y ?? 0) + offsetY}
      textAnchor={placeRight ? "start" : "end"}
      dominantBaseline="central"
      fill="var(--foreground)"
      stroke="var(--background)"
      strokeWidth={3.5}
      strokeLinejoin="round"
      paintOrder="stroke"
      fontSize={important ? 10.5 : 9.5}
      fontWeight={important ? 650 : 500}
      opacity={important ? 1 : 0.78}
      className="pointer-events-none"
    >
      {compactName}
    </text>
  );
}

function getScatterLabelPlacement(
  targetIndex: number,
  points: VelocityExpiryPoint[],
  maxVelocity: number,
  maxExpiry: number
) {
  const placed: Array<{ left: number; right: number; y: number }> = [];
  let result = { offsetY: -14, placeRight: true };

  points.slice(0, targetIndex + 1).forEach((point, pointIndex) => {
    const important =
      point.expiryLoss >= EXPIRY_LOSS_ATTENTION_THRESHOLD;
    const compactName = truncateProductName(point.name, important ? 21 : 16);
    const pointX = (point.velocity / Math.max(maxVelocity, 1)) * 900;
    const pointY =
      (1 - point.expiryLoss / Math.max(maxExpiry, 1)) * 300;
    const labelWidth = compactName.length * (important ? 6 : 5.5);
    const naturalRight =
      point.velocity < VELOCITY_EXPLANATION_THRESHOLD;
    const offsets = important
      ? [-16, 18, -32, 34, -48, 50, -64, 66]
      : [-14, -29, -44, -59, -74, -89];
    const candidates = offsets.flatMap((offsetY, offsetIndex) => {
      const preferredRight =
        offsetIndex % 2 === 0 ? naturalRight : !naturalRight;
      return [
        { offsetY, placeRight: preferredRight },
        { offsetY, placeRight: !preferredRight },
      ];
    });

    const placement =
      candidates.find((candidate) => {
        const labelY = pointY + candidate.offsetY;
        if (labelY < 8 || labelY > 292) return false;
        const left = candidate.placeRight
          ? pointX + 7
          : pointX - 7 - labelWidth;
        const right = left + labelWidth;
        return !placed.some(
          (label) =>
            Math.abs(label.y - labelY) < 13 &&
            left < label.right + 5 &&
            right > label.left - 5
        );
      }) ?? candidates[0];
    const labelY = pointY + placement.offsetY;
    const left = placement.placeRight
      ? pointX + 7
      : pointX - 7 - labelWidth;
    placed.push({ left, right: left + labelWidth, y: labelY });
    if (pointIndex === targetIndex) result = placement;
  });

  return result;
}

function VelocityExpiryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: VelocityExpiryPoint }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="min-w-56 rounded-lg border bg-background/98 p-3 text-xs shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{point.name}</p>
          <p className="mt-1 text-[0.65rem] text-muted-foreground">
            {point.category}
          </p>
        </div>
        <span
          className="mt-1 size-2 shrink-0 rounded-full"
          style={{ background: scatterZoneColors[point.zone] }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.07em] text-muted-foreground">
            Sales velocity
          </p>
          <p className="mt-1 font-semibold tabular-nums">
            {point.velocity.toFixed(1)} units/day
          </p>
        </div>
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.07em] text-muted-foreground">
            Expiry Loss
          </p>
          <p className="mt-1 font-semibold tabular-nums">
            {currency.format(point.expiryLoss)}
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-muted/60 px-2.5 py-2">
        <p className="text-[0.62rem] uppercase tracking-[0.07em] text-muted-foreground">
          Risk zone
        </p>
        <p className="mt-1 font-semibold text-foreground">{point.zoneLabel}</p>
      </div>
    </div>
  );
}

function truncateProductName(name: string, maxLength: number) {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

const rangeLabels: Record<AnalyticsRange, string> = {
  7: "7 Days",
  30: "30 Days",
  90: "90 Days",
  180: "6 Months",
};

const scatterZoneColors = {
  healthy: "var(--chart-2)",
  monitor: "var(--muted-foreground)",
  "demand-overstock-risk": "var(--chart-4)",
  "high-volume-expiry-anomaly": "var(--destructive)",
} as const;

const scatterZoneLegend = [
  {
    label: "Healthy",
    detail: "High velocity · low expiry loss",
    color: scatterZoneColors.healthy,
  },
  {
    label: "Monitor",
    detail: "Low velocity · low expiry loss",
    color: scatterZoneColors.monitor,
  },
  {
    label: "Demand / Overstock Risk",
    detail: "Low velocity · high expiry loss",
    color: scatterZoneColors["demand-overstock-risk"],
  },
  {
    label: "High-Volume Expiry Anomaly",
    detail: "High velocity · high expiry loss",
    color: scatterZoneColors["high-volume-expiry-anomaly"],
  },
] as const;
