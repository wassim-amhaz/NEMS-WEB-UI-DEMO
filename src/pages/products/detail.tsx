import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Barcode,
  Boxes,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Gauge,
  Layers3,
  ListChecks,
  PackageCheck,
  PackageSearch,
  Radar,
  ScanLine,
  ShieldCheck,
  ShieldOff,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router";

import { useBranch } from "@/components/nems/branch-context";
import { SectionHeader, StatusBadge } from "@/components/nems/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getProductCatalogRows } from "@/mock/product-catalog";
import { getVelocityLabel } from "@/mock/operational-helpers";
import {
  getProductIntelligence,
  type ProductBatchStatus,
  type ProductHistoryItem,
  type ProductIntelligence,
} from "@/mock/product-intelligence";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string | null | undefined) {
  return value ? dateFormatter.format(new Date(`${value}T12:00:00Z`)) : "—";
}

export function ProductIntelligencePage() {
  const { id } = useParams();
  const { selectedBranchId } = useBranch();
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [removeBeforeDays, setRemoveBeforeDays] = useState(3);
  const [demoTracked, setDemoTracked] = useState(false);
  const intelligence = useMemo(
    () => (id ? getProductIntelligence(id, selectedBranchId) : undefined),
    [id, selectedBranchId]
  );
  const catalogRow = useMemo(
    () =>
      id
        ? getProductCatalogRows(selectedBranchId).find(
            (row) => row.product.id === id
          ) ?? getProductCatalogRows().find((row) => row.product.id === id)
        : undefined,
    [id, selectedBranchId]
  );

  useEffect(() => {
    setDemoTracked(false);
    setTrackDialogOpen(false);
  }, [id, selectedBranchId]);

  if (!intelligence) return <Navigate to="/products" replace />;

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-5 lg:space-y-6">
      <ProductHeader
        intelligence={intelligence}
        demoTracked={demoTracked}
        demoRemoveBeforeDays={removeBeforeDays}
      />

      {intelligence.isTrackedInContext ? (
        <TrackedProductIntelligence intelligence={intelligence} />
      ) : (
        <UntrackedProductState
          intelligence={intelligence}
          catalogStock={catalogRow?.currentStock ?? 0}
          catalogVelocity={catalogRow?.averageDailyVelocity ?? 0}
          demoTracked={demoTracked}
          onTrack={() => {
            setRemoveBeforeDays(intelligence.product.removeBeforeDays ?? 3);
            setTrackDialogOpen(true);
          }}
        />
      )}

      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Track with NEMS</DialogTitle>
            <DialogDescription>
              Configure the removal lead time for {intelligence.product.name} in{" "}
              {intelligence.contextLabel}. This tracking change applies to the
              current session.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4">
            <Label htmlFor="product-remove-before">Remove Before value</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="product-remove-before"
                type="number"
                min={1}
                max={30}
                value={removeBeforeDays}
                onChange={(event) =>
                  setRemoveBeforeDays(Number(event.target.value))
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                days before expiry
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDemoTracked(true);
                setTrackDialogOpen(false);
              }}
            >
              Start tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProductHeader({
  intelligence,
  demoTracked,
  demoRemoveBeforeDays,
}: {
  intelligence: ProductIntelligence;
  demoTracked: boolean;
  demoRemoveBeforeDays: number;
}) {
  const { product } = intelligence;
  const tracked = intelligence.isTrackedInContext;

  return (
    <div className="border-b border-border/70 pb-5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 gap-1.5 text-muted-foreground"
      >
        <Link to="/products">
          <ArrowLeft className="size-3.5" />
          Back to Master Products
        </Link>
      </Button>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
            <PackageSearch className="size-4" />
            Product Intelligence
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {product.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ScanLine className="size-3.5" />
              {product.sku} · {product.id}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Barcode className="size-3.5" />
              {product.barcode}
            </span>
            <span>{intelligence.categoryName}</span>
            <span>{intelligence.supplierName}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Badge
            variant="outline"
            className="rounded-md bg-muted/40 px-2.5 py-1"
          >
            <Warehouse className="mr-1.5 size-3.5" />
            {intelligence.contextLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "rounded-md px-2.5 py-1",
              tracked || demoTracked
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {tracked || demoTracked ? (
              <ShieldCheck className="mr-1.5 size-3.5" />
            ) : (
              <ShieldOff className="mr-1.5 size-3.5" />
            )}
            {demoTracked
              ? "Tracking configured"
              : tracked
              ? "NEMS tracked"
              : `Not tracked in ${intelligence.contextLabel}`}
          </Badge>
          <Badge variant="secondary" className="rounded-md px-2.5 py-1">
            Remove Before:{" "}
            {demoTracked
              ? `${demoRemoveBeforeDays} days`
              : product.removeBeforeDays
              ? `${product.removeBeforeDays} days`
              : "—"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function TrackedProductIntelligence({
  intelligence,
}: {
  intelligence: ProductIntelligence;
}) {
  const { metrics } = intelligence;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <IntelligenceMetric
          label="Current Stock"
          value={number.format(metrics.currentStock)}
          detail={`${metrics.averageDailyVelocity.toFixed(1)} units sold / day`}
          icon={Boxes}
        />
        <IntelligenceMetric
          label="Sales Velocity"
          value={`${metrics.averageDailyVelocity.toFixed(1)}/day`}
          detail={`${getVelocityLabel(metrics.averageDailyVelocity)} sales velocity`}
          icon={TrendingUp}
        />
        <IntelligenceMetric
          label="Active Batches"
          value={number.format(metrics.activeBatches)}
          detail={
            intelligence.nextRemovalDate
              ? `Next remove ${formatDate(intelligence.nextRemovalDate)}`
              : "No active removal date"
          }
          icon={Layers3}
        />
        <IntelligenceMetric
          label="Expiry Exposure"
          value={currency.format(metrics.expiryExposure)}
          detail={`${number.format(
            metrics.expiryExposureUnits
          )} units currently exposed`}
          icon={CalendarClock}
          tone={metrics.expiryExposure > 0 ? "warning" : "success"}
        />
        <IntelligenceMetric
          label="Confirmed FIFO Loss"
          value={currency.format(metrics.fifoLoss)}
          detail={`${metrics.fifoUnits} units · ${metrics.fifoLossRate.toFixed(
            2
          )}% rate`}
          icon={ShoppingCart}
          tone={metrics.fifoLoss > 0 ? "danger" : "success"}
        />
        <IntelligenceMetric
          label="Avoidable Loss"
          value={currency.format(metrics.avoidableLoss)}
          detail={`${currency.format(metrics.expiryLoss)} expiry loss`}
          icon={CircleDollarSign}
          tone={metrics.avoidableLoss > 0 ? "danger" : "success"}
        />
      </div>

      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto border-b border-border/70 pb-3">
          <TabsList className="h-10 min-w-max bg-muted/70">
            {[
              "overview",
              "batches",
              "fifo",
              "expiry",
              "actions",
              "history",
            ].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab === "fifo" ? "FIFO" : tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewTab intelligence={intelligence} />
        </TabsContent>
        <TabsContent value="batches">
          <BatchesTab intelligence={intelligence} />
        </TabsContent>
        <TabsContent value="fifo">
          <FifoTab intelligence={intelligence} />
        </TabsContent>
        <TabsContent value="expiry">
          <ExpiryTab intelligence={intelligence} />
        </TabsContent>
        <TabsContent value="actions">
          <ActionsTab intelligence={intelligence} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab intelligence={intelligence} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function OverviewTab({ intelligence }: { intelligence: ProductIntelligence }) {
  const { metrics } = intelligence;
  const riskTone =
    metrics.risk === "critical"
      ? "critical"
      : metrics.risk === "high"
      ? "high"
      : metrics.risk === "medium"
      ? "medium"
      : "healthy";
  const totalLoss =
    metrics.fifoLoss + metrics.expiryLoss + metrics.earlyRemovalLoss;
  const lossRows = [
    { label: "FIFO Loss", value: metrics.fifoLoss, className: "bg-red-500" },
    {
      label: "Expiry Loss",
      value: metrics.expiryLoss,
      className: "bg-amber-500",
    },
    {
      label: "Early-Removal Loss",
      value: metrics.earlyRemovalLoss,
      className: "bg-sky-500",
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <SectionHeader
            title="Operational Position"
            description={`Current product position for ${intelligence.contextLabel}.`}
          />
        </CardHeader>
        <CardContent className="grid gap-0 p-0 sm:grid-cols-2">
          <SummaryItem
            label="Stock cover"
            value={
              metrics.averageDailyVelocity > 0
                ? `${(
                    metrics.currentStock / metrics.averageDailyVelocity
                  ).toFixed(1)} days`
                : "No sales rate"
            }
            detail={`${number.format(
              metrics.currentStock
            )} units currently held`}
          />
          <SummaryItem
            label="Next removal"
            value={formatDate(intelligence.nextRemovalDate)}
            detail={
              intelligence.nextRemovalDate
                ? "Earliest active batch deadline"
                : "No active removal deadline"
            }
          />
          <SummaryItem
            label="Current exposure"
            value={currency.format(metrics.expiryExposure)}
            detail="Stock expiring within 14 days"
          />
          <SummaryItem
            label="Operational actions"
            value={`${metrics.openActions} open`}
            detail={`${
              intelligence.actions.filter(
                (action) => action.status === "completed"
              ).length
            } completed in visible history`}
          />
        </CardContent>
      </Card>
      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <SectionHeader
            title="Current Attention"
            description="What supervisors should know now."
            action={
              <StatusBadge status={riskTone}>{metrics.risk} risk</StatusBadge>
            }
          />
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/25 p-4">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                metrics.risk === "healthy"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              )}
            >
              {metrics.risk === "healthy" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <TriangleAlert className="size-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {getAttentionTitle(intelligence)}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {getAttentionDescription(intelligence)}
              </p>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-semibold">Loss profile</span>
              <span className="text-muted-foreground">
                {currency.format(totalLoss)} confirmed
              </span>
            </div>
            <div className="space-y-3">
              {lossRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[0.68rem]">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium tabular-nums">
                      {currency.format(row.value)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", row.className)}
                      style={{
                        width: `${
                          totalLoss ? (row.value / totalLoss) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BatchesTab({ intelligence }: { intelligence: ProductIntelligence }) {
  if (!intelligence.batchRows.length)
    return (
      <EmptyState
        icon={PackageCheck}
        title="No batch history in this context"
        description="This tracked product has no active or depleted batches for the selected branch scope."
      />
    );
  return (
    <Card className="gap-0 overflow-hidden border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <SectionHeader
          title="Batch Intelligence"
          description="Active and recently depleted batches, ordered by removal priority."
          action={
            <Badge variant="secondary" className="rounded-md">
              {
                intelligence.batchRows.filter(
                  (row) => row.batch.status === "active"
                ).length
              }{" "}
              active
            </Badge>
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead className="pl-5">Batch</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Removal</TableHead>
              <TableHead className="text-right">Original</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5">FIFO Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intelligence.batchRows.map((row) => (
              <TableRow
                key={row.batch.id}
                className={cn(row.consumeFirst && "bg-primary/[0.025]")}
              >
                <TableCell className="pl-5">
                  <Link
                    to={`/batches?batch=${row.batch.id}`}
                    className="group inline-flex flex-col"
                  >
                    <span className="text-xs font-semibold group-hover:text-primary">
                      {row.batch.lotNumber}
                    </span>
                    <span className="mt-0.5 text-[0.64rem] text-muted-foreground group-hover:text-primary/80">
                      {row.batch.id}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{row.branch.name}</TableCell>
                <TableCell className="text-xs tabular-nums">
                  {formatDate(row.batch.receivedDate)}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {formatDate(row.batch.expiryDate)}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {formatDate(row.batch.removalDate)}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {number.format(row.batch.initialUnits)}
                </TableCell>
                <TableCell className="text-right text-xs font-semibold tabular-nums">
                  {number.format(row.batch.unitsOnHand)}
                </TableCell>
                <TableCell>
                  <BatchStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="pr-5">
                  {row.fifoPosition ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-md text-[0.65rem] font-bold",
                          row.consumeFirst
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {row.fifoPosition}
                      </span>
                      <span className="text-xs">
                        {row.consumeFirst
                          ? "Consume First"
                          : `Position ${row.fifoPosition}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Closed
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FifoTab({ intelligence }: { intelligence: ProductIntelligence }) {
  const { metrics } = intelligence;
  const suspectedCount = intelligence.fifoSignals.filter(
    (signal) => signal.state === "suspected"
  ).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactMetric
          label="Confirmed FIFO Loss"
          value={currency.format(metrics.fifoLoss)}
          detail={`${metrics.fifoUnits} units`}
        />
        <CompactMetric
          label="FIFO Loss Rate"
          value={`${metrics.fifoLossRate.toFixed(2)}%`}
          detail="Against estimated monthly sales"
        />
        <CompactMetric
          label="Confirmed Events"
          value={number.format(intelligence.fifoEvents.length)}
          detail="Current visible period"
        />
        <CompactMetric
          label="Suspected Signals"
          value={number.format(suspectedCount)}
          detail={
            suspectedCount ? "Awaiting verification" : "No anomalies pending"
          }
          tone={suspectedCount ? "warning" : "success"}
        />
      </div>
      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <SectionHeader
            title="FIFO Event Review"
            description="Confirmed losses are financially recognized; suspected signals require operational verification."
          />
        </CardHeader>
        <CardContent className="p-0">
          {intelligence.fifoSignals.length ? (
            <div className="divide-y">
              {intelligence.fifoSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[8rem_8rem_1fr_auto] md:items-center"
                >
                  <div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md text-[0.65rem]",
                        signal.state === "confirmed"
                          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {signal.state}
                    </Badge>
                    <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
                      {formatDate(signal.occurredAt)}
                    </p>
                  </div>
                  <p className="text-xs font-medium">{signal.branch.name}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {signal.description}
                  </p>
                  <div className="text-right">
                    <p className="text-xs font-semibold tabular-nums">
                      {signal.value === null
                        ? "Pending"
                        : currencyPrecise.format(signal.value)}
                    </p>
                    <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                      {signal.units === null
                        ? "No loss confirmed"
                        : `${signal.units} units`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <InlineHealthyState
              title="FIFO sequence is healthy"
              description="No confirmed loss or suspected FIFO anomaly exists for this product in the selected context."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpiryTab({ intelligence }: { intelligence: ProductIntelligence }) {
  const { metrics } = intelligence;
  const events = [
    ...intelligence.expiryEvents.map((event) => ({
      ...event,
      label: "Expiry Loss",
      tone: "danger" as const,
    })),
    ...intelligence.earlyRemovalEvents.map((event) => ({
      ...event,
      label: "Early-Removal Loss",
      tone: "warning" as const,
    })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactMetric
          label="Expiry Loss"
          value={currency.format(metrics.expiryLoss)}
          detail={`${metrics.expiryUnits} expired units`}
        />
        <CompactMetric
          label="Early-Removal Loss"
          value={currency.format(metrics.earlyRemovalLoss)}
          detail={`${metrics.earlyRemovalUnits} removed units`}
        />
        <CompactMetric
          label="Avoidable Loss"
          value={currency.format(metrics.avoidableLoss)}
          detail="FIFO + preventable expiry/removal"
        />
        <CompactMetric
          label="Upcoming Exposure"
          value={currency.format(metrics.expiryExposure)}
          detail="Expiry within 14 days"
          tone={metrics.expiryExposure ? "warning" : "success"}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <Card className="gap-0 border-border/75 py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <SectionHeader
              title="Expiry & Removal History"
              description="Confirmed expiry and early-removal outcomes for this product."
            />
          </CardHeader>
          <CardContent className="p-0">
            {events.length ? (
              <div className="divide-y">
                {events.map((event) => {
                  const branchName = intelligence.batchRows.find(
                    (row) => row.batch.branchId === event.branchId
                  )?.branch.name;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          event.tone === "danger"
                            ? "bg-red-500/10 text-red-700 dark:text-red-400"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {event.tone === "danger" ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <Clock3 className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold">{event.label}</p>
                          {branchName ? (
                            <Badge
                              variant="secondary"
                              className="rounded-md text-[0.62rem]"
                            >
                              {branchName}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[0.68rem] text-muted-foreground">
                          {formatDate(event.occurredAt)} · {event.units} units
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">
                        {currencyPrecise.format(event.value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <InlineHealthyState
                title="No expiry loss history"
                description="No expiry or early-removal loss is recorded for this product in the selected context."
              />
            )}
          </CardContent>
        </Card>
        <Card className="gap-0 border-border/75 py-0 shadow-sm">
          <CardContent className="p-5">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                intelligence.recurringExpiryLoss
                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              )}
            >
              {intelligence.recurringExpiryLoss ? (
                <Radar className="size-[1.1rem]" />
              ) : (
                <CheckCircle2 className="size-[1.1rem]" />
              )}
            </span>
            <p className="mt-4 text-sm font-semibold">
              {intelligence.recurringExpiryLoss
                ? "Recurring expiry pattern"
                : "No recurring pattern"}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {intelligence.recurringExpiryLoss
                ? "Repeated expiry events indicate a demand-planning or replenishment issue worth reviewing."
                : "The visible event history does not indicate repeated expiry loss."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionsTab({ intelligence }: { intelligence: ProductIntelligence }) {
  if (!intelligence.actions.length)
    return (
      <EmptyState
        icon={ListChecks}
        title="No product actions"
        description="There are no open, overdue, or recently completed operational actions for this product in the selected context."
      />
    );
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <SectionHeader
          title="Product Actions"
          description="Operational work linked only to this product."
          action={
            <Badge variant="secondary" className="rounded-md">
              {intelligence.metrics.openActions} open
            </Badge>
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {intelligence.actions.map((action) => (
            <div
              key={action.id}
              className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_9rem_8rem_7rem] md:items-center"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    action.displayStatus === "Completed"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : action.displayStatus === "Overdue"
                      ? "bg-red-500/10 text-red-700 dark:text-red-400"
                      : "bg-primary/8 text-primary"
                  )}
                >
                  {action.displayStatus === "Completed" ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <ListChecks className="size-4" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-semibold">{action.title}</p>
                  <p className="mt-1 text-[0.65rem] capitalize text-muted-foreground">
                    {action.type} · {action.priority} priority
                  </p>
                </div>
              </div>
              <p className="text-xs">{action.branch.name}</p>
              <p className="text-xs tabular-nums">
                Due {formatDate(action.dueAt)}
              </p>
              <ActionStatusBadge status={action.displayStatus} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryTab({ intelligence }: { intelligence: ProductIntelligence }) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <SectionHeader
          title="Operational History"
          description="A compact audit timeline assembled from batches, losses, and product actions."
        />
      </CardHeader>
      <CardContent className="p-5">
        {intelligence.history.length ? (
          <div className="relative space-y-0 before:absolute before:bottom-3 before:left-[0.95rem] before:top-3 before:w-px before:bg-border">
            {intelligence.history.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <InlineHealthyState
            title="No operational history yet"
            description="Events will appear after the product receives its first tracked batch."
          />
        )}
      </CardContent>
    </Card>
  );
}

function UntrackedProductState({
  intelligence,
  catalogStock,
  catalogVelocity,
  demoTracked,
  onTrack,
}: {
  intelligence: ProductIntelligence;
  catalogStock: number;
  catalogVelocity: number;
  demoTracked: boolean;
  onTrack: () => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_23rem]">
      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex max-w-3xl flex-col items-start">
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-xl",
                demoTracked
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {demoTracked ? (
                <ShieldCheck className="size-5" />
              ) : (
                <ShieldOff className="size-5" />
              )}
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight">
              {demoTracked
                ? "Tracking configured for this session"
                : "Not tracked by NEMS"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {demoTracked
                ? "The Remove Before setting is ready. Product intelligence will begin when the first tracked batch is received; no historical losses or actions were invented."
                : `NEMS does not hold batch, FIFO, expiry, loss, or action intelligence for this product in ${intelligence.contextLabel}. It remains visible as part of the master catalog.`}
            </p>
            {!demoTracked ? (
              <Button className="mt-5 gap-2" onClick={onTrack}>
                <Radar className="size-4" />
                Track with NEMS
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <SectionHeader
            title="Catalog Position"
            description="Basic commercial data only."
          />
        </CardHeader>
        <CardContent className="divide-y p-0">
          <CatalogLine
            label="Branch availability"
            value={
              intelligence.isAvailableInContext ? "Stocked" : "Not stocked"
            }
          />
          <CatalogLine
            label="Estimated stock"
            value={number.format(catalogStock)}
          />
          <CatalogLine
            label="Sales velocity"
            value={`${catalogVelocity.toFixed(1)} / day`}
          />
          <CatalogLine
            label="Unit cost"
            value={currencyPrecise.format(intelligence.product.unitCost)}
          />
          <CatalogLine label="NEMS intelligence" value="Unavailable" muted />
        </CardContent>
      </Card>
    </div>
  );
}

function IntelligenceMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const tones = {
    default: "bg-primary/8 text-primary",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-700 dark:text-red-400",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="size-[1.05rem]" />
        </span>
        <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-[0.68rem] leading-5 text-muted-foreground">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function CompactMetric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-2 text-xl font-semibold tracking-tight tabular-nums",
            tone === "warning" && "text-amber-700 dark:text-amber-400",
            tone === "success" && "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {value}
        </p>
        <p className="mt-1 text-[0.68rem] text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-b p-5 even:sm:border-l sm:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function BatchStatusBadge({ status }: { status: ProductBatchStatus }) {
  const labels: Record<ProductBatchStatus, string> = {
    open: "Open",
    "remove-soon": "Remove Soon",
    "remove-today": "Remove Today",
    overdue: "Overdue",
    depleted: "Depleted",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md text-[0.64rem]",
        status === "overdue"
          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
          : status === "remove-today" || status === "remove-soon"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : status === "open"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {labels[status]}
    </Badge>
  );
}

function ActionStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit rounded-md text-[0.64rem]",
        status === "Overdue"
          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
          : status === "Completed"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400"
      )}
    >
      {status}
    </Badge>
  );
}

function HistoryRow({ item }: { item: ProductHistoryItem }) {
  const config: Record<
    ProductHistoryItem["type"],
    { icon: LucideIcon; className: string }
  > = {
    received: {
      icon: Boxes,
      className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    },
    "expiry-entered": {
      icon: CalendarClock,
      className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    },
    "stock-change": { icon: Gauge, className: "bg-primary/8 text-primary" },
    removal: {
      icon: Clock3,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    fifo: {
      icon: ShoppingCart,
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
    expiry: {
      icon: AlertTriangle,
      className: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
    depletion: {
      icon: PackageCheck,
      className: "bg-muted text-muted-foreground",
    },
    action: {
      icon: ListChecks,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
  };
  const Icon = config[item.type].icon;
  return (
    <div className="relative grid gap-2 py-3 pl-12 sm:grid-cols-[9rem_1fr]">
      <span
        className={cn(
          "absolute left-0 z-10 flex size-8 items-center justify-center rounded-full border-4 border-card",
          config[item.type].className
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div>
        <p className="text-[0.68rem] font-medium tabular-nums">
          {formatDate(item.occurredAt)}
        </p>
        <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
          {item.branch.name}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="min-h-[20rem] border-dashed bg-card/70 shadow-none">
      <CardContent className="flex h-full min-h-[20rem] items-center justify-center p-6">
        <InlineHealthyState
          icon={Icon}
          title={title}
          description={description}
        />
      </CardContent>
    </Card>
  );
}

function InlineHealthyState({
  icon: Icon = CheckCircle2,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <span className="mx-auto flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        <Icon className="size-[1.1rem]" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function CatalogLine({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function getAttentionTitle(intelligence: ProductIntelligence) {
  const { metrics } = intelligence;
  if (metrics.risk === "healthy") return "Normal operating state";
  if (intelligence.batchRows.some((row) => row.status === "overdue"))
    return "Removal deadline overdue";
  if (metrics.openActions > 0)
    return `${metrics.openActions} operational action${
      metrics.openActions === 1 ? "" : "s"
    } open`;
  if (metrics.expiryExposure > 0) return "Upcoming expiry exposure";
  return "Loss pattern requires review";
}

function getAttentionDescription(intelligence: ProductIntelligence) {
  const { metrics } = intelligence;
  if (metrics.risk === "healthy")
    return "No loss event, overdue removal, or open action currently requires intervention.";
  if (intelligence.batchRows.some((row) => row.status === "overdue"))
    return "At least one active batch has passed its Remove Before date. Confirm removal and shelf sequence.";
  if (metrics.openActions > 0)
    return "Review the Actions tab for assigned work and due dates linked to this product.";
  if (metrics.expiryExposure > 0)
    return `${currency.format(
      metrics.expiryExposure
    )} is currently exposed within the next 14 days.`;
  return "Confirmed loss history is visible in the FIFO and Expiry sections.";
}
