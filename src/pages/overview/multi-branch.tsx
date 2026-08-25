import { useMemo, type ReactElement } from "react";
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  Layers3,
  Network,
  PackageCheck,
  ShieldAlert,
  TimerReset,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  MetricCard,
  SectionHeader,
  StatusBadge,
} from "@/components/nems/dashboard-ui";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getNetworkDashboard,
  type BranchPerformance,
  type RecurringLossProduct,
} from "@/mock/network-dashboard";

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

const lossChartConfig = {
  fifo: { label: "FIFO loss", color: "var(--chart-1)" },
  expiry: { label: "Expiry loss", color: "var(--chart-5)" },
} satisfies ChartConfig;

const complianceChartConfig = {
  removal: { label: "Removal", color: "var(--chart-1)" },
  action: { label: "Action", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function MultiBranchCommandCenter() {
  const network = useMemo(() => getNetworkDashboard(), []);
  const { metrics } = network;

  const lossChartData = network.branchPerformance.map((item) => ({
    branch: item.branch.name.replace(" Branch", ""),
    fifo: Number(item.fifoLossValue.toFixed(2)),
    expiry: Number(item.dashboard.metrics.expiryLoss.toFixed(2)),
  }));
  const complianceChartData = network.branchPerformance.map((item) => ({
    branch: item.branch.name.replace(" Branch", ""),
    removal: Number(item.dashboard.metrics.removalCompliance.toFixed(1)),
    action: Number(item.dashboard.metrics.actionCompliance.toFixed(1)),
  }));

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">
              Multi-Branch Command Center
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-primary/20 bg-primary/5 text-[0.66rem] text-primary"
            >
              Network view
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            All Branches
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Company-wide inventory control, loss, compliance, and management attention across the operating network.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5">
            <Building2 className="size-3.5 text-primary" />
            {network.branchPerformance.length} operating branches
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5">
            <Layers3 className="size-3.5 text-primary" />
            {metrics.trackedProducts} tracked products
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5">
            <ClipboardCheck className="size-3.5 text-amber-600 dark:text-amber-400" />
            {metrics.openActions} open actions
          </span>
          <span className="inline-flex items-center gap-1.5 px-1.5">
            Updated 08:42
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Confirmed FIFO Loss"
          value={currency.format(metrics.fifoLoss)}
          secondary={`${number.format(metrics.fifoUnits)} units across the network`}
          trend={metrics.fifoDelta}
          positive={metrics.fifoDelta < 0}
          icon={TimerReset}
          tone="danger"
        />
        <MetricCard
          label="Total Expiry Loss"
          value={currency.format(metrics.expiryLoss)}
          secondary="Confirmed tracked-product loss · 30 days"
          trend={metrics.expiryDelta}
          positive={metrics.expiryDelta < 0}
          icon={AlertTriangle}
          tone="warning"
        />
        <MetricCard
          label="Estimated Avoidable Loss"
          value={currency.format(metrics.avoidableLoss)}
          secondary="Network recovery opportunity"
          trend={metrics.avoidableDelta}
          positive={metrics.avoidableDelta < 0}
          icon={CircleDollarSign}
          tone="danger"
        />
        <MetricCard
          label="Average Removal Compliance"
          value={`${metrics.removalCompliance.toFixed(1)}%`}
          secondary="Average across four operating branches"
          trend={metrics.removalDelta}
          trendSuffix=" pp"
          positive={metrics.removalDelta > 0}
          icon={PackageCheck}
          tone="success"
        />
        <MetricCard
          label="Average Action Compliance"
          value={`${metrics.actionCompliance.toFixed(1)}%`}
          secondary={`${metrics.openActions} actions remain open`}
          trend={metrics.actionDelta}
          trendSuffix=" pp"
          positive={metrics.actionDelta > 0}
          icon={ClipboardCheck}
          tone="success"
        />
        <MetricCard
          label="Current Expiry Exposure"
          value={currency.format(metrics.expiryExposure)}
          secondary={`${number.format(metrics.exposureUnits)} units currently at risk`}
          trend={metrics.exposureDelta}
          positive={metrics.exposureDelta < 0}
          icon={ShieldAlert}
          tone="warning"
        />
      </div>

      <BranchPerformanceTable items={network.branchPerformance} />

      <div className="grid gap-5 xl:grid-cols-2">
        <ComparisonChart
          title="Loss by Branch"
          description="Confirmed FIFO and expiry loss value for the current 30-day period."
          config={lossChartConfig}
        >
          <BarChart data={lossChartData} margin={{ top: 8, left: 0, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="branch"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value) => compactCurrency.format(value)}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={<ChartTooltipContent />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="fifo"
              fill="var(--color-fifo)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expiry"
              fill="var(--color-expiry)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ComparisonChart>

        <ComparisonChart
          title="Compliance Comparison"
          description="Removal precision versus on-time operational action completion."
          config={complianceChartConfig}
        >
          <BarChart
            data={complianceChartData}
            margin={{ top: 8, left: 0, right: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="branch"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              domain={[50, 100]}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={<ChartTooltipContent />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="removal"
              fill="var(--color-removal)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="action"
              fill="var(--color-action)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ComparisonChart>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <ManagementAttention items={network.managementAttention} />
        <RecurringProducts items={network.recurringLossProducts} />
      </div>
    </section>
  );
}

function BranchPerformanceTable({ items }: { items: BranchPerformance[] }) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title="Branch Performance"
          description="Comparable tracked-product metrics across the operating network."
          action={
            <Badge variant="secondary" className="rounded-md">
              30-day view
            </Badge>
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[1050px]">
            <TableHeader>
              <TableRow className="bg-muted/35 hover:bg-muted/35">
                <TableHead className="pl-5">Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">FIFO rate</TableHead>
                <TableHead className="text-right">Expiry loss</TableHead>
                <TableHead className="text-right">Avoidable</TableHead>
                <TableHead className="text-right">Removal</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead className="text-right">Exposure</TableHead>
                <TableHead className="pr-5 text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.branch.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                        <Building2 className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold">{item.branch.name}</p>
                        <p className="mt-0.5 text-[0.66rem] text-muted-foreground">
                          {item.branch.code} · {item.dashboard.trackedProductCount} tracked
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.risk}>
                      {item.risk === "medium" ? "Watch" : item.risk}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums">
                    {item.dashboard.metrics.fifoLossRate.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums">
                    {currency.format(item.dashboard.metrics.expiryLoss)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums">
                    {currency.format(item.dashboard.metrics.avoidableLoss)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums">
                    {item.dashboard.metrics.removalCompliance.toFixed(1)}%
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-xs font-medium tabular-nums",
                      item.dashboard.metrics.actionCompliance < 75 &&
                        "text-red-600 dark:text-red-400"
                    )}
                  >
                    {item.dashboard.metrics.actionCompliance.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums">
                    {currency.format(item.dashboard.metrics.expiryExposure)}
                  </TableCell>
                  <TableCell className="pr-5 text-right text-xs font-semibold tabular-nums">
                    {item.dashboard.openActionCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

type ComparisonChartProps = {
  title: string;
  description: string;
  config: ChartConfig;
  children: ReactElement;
};

function ComparisonChart({
  title,
  description,
  config,
  children,
}: ComparisonChartProps) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title={title}
          description={description}
          action={<Network className="size-4 text-muted-foreground" />}
        />
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-4 sm:px-5">
        <ChartContainer config={config} className="h-[260px] w-full aspect-auto">
          {children}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ManagementAttention({ items }: { items: BranchPerformance[] }) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title="Management Attention"
          description="Branches ranked by current operational risk signals."
          action={<ShieldAlert className="size-4 text-red-500" />}
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item, index) => (
            <div key={item.branch.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[0.68rem] font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold">{item.branch.name}</p>
                  <StatusBadge status={item.risk}>
                    {item.risk === "medium" ? "Watch" : item.risk}
                  </StatusBadge>
                </div>
                <div className="mt-2 space-y-1">
                  {item.attentionReasons.slice(0, 2).map((reason) => (
                    <p
                      key={reason}
                      className="flex items-start gap-1.5 text-[0.69rem] leading-4 text-muted-foreground"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                      {reason}
                    </p>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold tabular-nums">
                  {currency.format(item.dashboard.metrics.expiryExposure)}
                </p>
                <p className="mt-1 text-[0.66rem] text-muted-foreground">
                  exposure
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecurringProducts({
  items,
}: {
  items: RecurringLossProduct[];
}) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <SectionHeader
          title="Recurring Loss Products"
          description="Tracked products generating loss in multiple branches."
          action={<Layers3 className="size-4 text-amber-500" />}
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
                <p className="truncate text-xs font-semibold">{item.product.name}</p>
                <p className="mt-1 text-[0.67rem] text-muted-foreground">
                  {item.branchCount} branches · {item.eventCount} events · {item.units} units
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold tabular-nums">
                  {currency.format(item.totalValue)}
                </p>
                <p className="mt-1 text-[0.64rem] text-muted-foreground">
                  FIFO {compactCurrency.format(item.fifoValue)} · Expiry {compactCurrency.format(item.expiryValue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
