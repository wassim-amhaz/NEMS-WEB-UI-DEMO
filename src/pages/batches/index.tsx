import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  History,
  Layers3,
  ListChecks,
  PackageCheck,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import { ALL_BRANCHES_ID, useBranch } from "@/components/nems/branch-context";
import { SectionHeader } from "@/components/nems/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  getBatchIntelligence,
  type BatchIntelligenceRow,
  type BatchOperationalStatus,
  type BatchRisk,
  type BatchTimelineItem,
  type FifoLabel,
  type RemovalWindow,
} from "@/mock/batch-intelligence";
import { branches, categories, suppliers } from "@/mock/nems-data";

const number = new Intl.NumberFormat("en-US");
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string | undefined) {
  return value
    ? dateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00Z`))
    : "—";
}

export function BatchesPage() {
  const { selectedBranchId } = useBranch();
  const [branchFilter, setBranchFilter] = useState(selectedBranchId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [fifoFilter, setFifoFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedBatch, setSelectedBatch] =
    useState<BatchIntelligenceRow | null>(null);

  useEffect(() => {
    setBranchFilter(selectedBranchId);
  }, [selectedBranchId]);

  const rows = useMemo(
    () => getBatchIntelligence(branchFilter),
    [branchFilter]
  );
  const activeRows = rows.filter((row) => row.batch.status === "active");
  const overdueCount = activeRows.filter(
    (row) => row.removalWindow === "overdue"
  ).length;
  const todayCount = activeRows.filter(
    (row) => row.removalWindow === "today"
  ).length;
  const nextSevenCount = activeRows.filter(
    (row) => row.daysToRemoval >= 1 && row.daysToRemoval <= 7
  ).length;
  const activeUnits = activeRows.reduce(
    (total, row) => total + row.batch.unitsOnHand,
    0
  );
  const scopeLabel =
    branchFilter === ALL_BRANCHES_ID
      ? "All Branches"
      : branches.find((branch) => branch.id === branchFilter)?.name ??
        "All Branches";

  const filteredRows = rows
    .filter((row) => {
      const query = search.trim().toLowerCase();
      return (
        (!query ||
          row.product.name.toLowerCase().includes(query) ||
          row.product.id.toLowerCase().includes(query) ||
          row.product.sku.toLowerCase().includes(query) ||
          row.product.barcode.includes(query) ||
          row.batch.id.toLowerCase().includes(query) ||
          row.batch.lotNumber.toLowerCase().includes(query)) &&
        (statusFilter === "all" ||
          (statusFilter === "active" && row.batch.status === "active") ||
          row.status === statusFilter) &&
        (categoryFilter === "all" ||
          row.product.categoryId === categoryFilter) &&
        (supplierFilter === "all" ||
          row.product.supplierId === supplierFilter) &&
        (windowFilter === "all" || row.removalWindow === windowFilter) &&
        (fifoFilter === "all" || row.fifoLabel === fifoFilter) &&
        (riskFilter === "all" || row.risk === riskFilter)
      );
    })
    .sort((a, b) => {
      if (a.batch.status !== b.batch.status)
        return a.batch.status === "active" ? -1 : 1;
      return a.batch.removalDate.localeCompare(b.batch.removalDate);
    });
  const visibleRows = filteredRows.slice(0, 120);
  const hasFilters =
    search ||
    statusFilter !== "active" ||
    categoryFilter !== "all" ||
    supplierFilter !== "all" ||
    windowFilter !== "all" ||
    fifoFilter !== "all" ||
    riskFilter !== "all" ||
    branchFilter !== selectedBranchId;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("active");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setWindowFilter("all");
    setFifoFilter("all");
    setRiskFilter("all");
    setBranchFilter(selectedBranchId);
  };

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
            <Boxes className="size-4" />
            Operations
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Batches
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            Tracked batch inventory organized by removal urgency, FIFO position,
            remaining quantity, and operational history.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit rounded-md border-primary/20 bg-primary/5 px-2.5 py-1 text-primary"
        >
          {scopeLabel} · {activeRows.length} active batches
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <BatchMetric
          label="Active Batches"
          value={activeRows.length}
          detail="Tracked inventory"
          icon={Layers3}
        />
        <BatchMetric
          label="Overdue Removal"
          value={overdueCount}
          detail="Requires immediate attention"
          icon={AlertTriangle}
          tone="danger"
        />
        <BatchMetric
          label="Remove Today"
          value={todayCount}
          detail="Due in current shift"
          icon={Clock3}
          tone="warning"
        />
        <BatchMetric
          label="Next 7 Days"
          value={nextSevenCount}
          detail="Upcoming removal workload"
          icon={CalendarClock}
          tone="warning"
        />
        <BatchMetric
          label="Units Remaining"
          value={number.format(activeUnits)}
          detail="Across active batches"
          icon={Boxes}
          tone="success"
        />
      </div>

      <Tabs defaultValue="timeline" className="gap-4">
        <div className="flex flex-col gap-3 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-10 bg-muted/70">
            <TabsTrigger value="timeline">Removal Timeline</TabsTrigger>
            <TabsTrigger value="all">All Batches</TabsTrigger>
          </TabsList>
          <FilterSelect
            value={branchFilter}
            onValueChange={setBranchFilter}
            placeholder="Branch"
            className="w-full sm:w-52"
            items={[
              { value: ALL_BRANCHES_ID, label: "All Branches" },
              ...branches.map((branch) => ({
                value: branch.id,
                label: branch.name,
              })),
            ]}
          />
        </div>
        <TabsContent value="timeline">
          <RemovalTimeline rows={activeRows} onSelect={setSelectedBatch} />
        </TabsContent>
        <TabsContent value="all">
          <div className="space-y-4">
            <Card className="gap-0 border-border/75 py-0 shadow-sm">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_repeat(3,minmax(10rem,0.42fr))]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search product, SKU, barcode, or batch ID..."
                      className="pl-9"
                      aria-label="Search batches"
                    />
                  </div>
                  <FilterSelect
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="Status"
                    items={[
                      { value: "active", label: "Active batches" },
                      { value: "all", label: "All statuses" },
                      { value: "open", label: "Open" },
                      { value: "remove-soon", label: "Remove soon" },
                      { value: "remove-today", label: "Remove today" },
                      { value: "overdue", label: "Overdue" },
                      { value: "depleted", label: "Depleted" },
                      {
                        value: "removed-resolved",
                        label: "Removed / resolved",
                      },
                    ]}
                  />
                  <FilterSelect
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    placeholder="Category"
                    items={[
                      { value: "all", label: "All categories" },
                      ...categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                    ]}
                  />
                  <FilterSelect
                    value={supplierFilter}
                    onValueChange={setSupplierFilter}
                    placeholder="Supplier"
                    items={[
                      { value: "all", label: "All suppliers" },
                      ...suppliers.map((supplier) => ({
                        value: supplier.id,
                        label: supplier.name,
                      })),
                    ]}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(10rem,0.42fr))_1fr]">
                  <FilterSelect
                    value={windowFilter}
                    onValueChange={setWindowFilter}
                    placeholder="Removal window"
                    items={[
                      { value: "all", label: "All removal windows" },
                      { value: "overdue", label: "Overdue" },
                      { value: "today", label: "Today" },
                      { value: "next3", label: "Next 3 days" },
                      { value: "next7", label: "Next 7 days" },
                      { value: "later", label: "Later" },
                      { value: "historical", label: "Historical" },
                    ]}
                  />
                  <FilterSelect
                    value={fifoFilter}
                    onValueChange={setFifoFilter}
                    placeholder="FIFO position"
                    items={[
                      { value: "all", label: "All FIFO positions" },
                      { value: "consume-first", label: "Consume first" },
                      { value: "next", label: "Next" },
                      { value: "later", label: "Later" },
                      { value: "closed", label: "Closed" },
                    ]}
                  />
                  <FilterSelect
                    value={riskFilter}
                    onValueChange={setRiskFilter}
                    placeholder="Risk"
                    items={[
                      { value: "all", label: "All risk levels" },
                      { value: "critical", label: "Critical" },
                      { value: "high", label: "High" },
                      { value: "medium", label: "Medium" },
                      { value: "healthy", label: "Healthy" },
                    ]}
                  />
                  <div className="flex items-center justify-end">
                    {hasFilters ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        onClick={clearFilters}
                      >
                        <RotateCcw className="size-3.5" />
                        Clear filters
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
            <BatchTable
              rows={visibleRows}
              total={filteredRows.length}
              scopeLabel={scopeLabel}
              onSelect={setSelectedBatch}
            />
          </div>
        </TabsContent>
      </Tabs>

      <BatchDetailSheet
        row={selectedBatch}
        onOpenChange={(open) => !open && setSelectedBatch(null)}
      />
    </section>
  );
}

const timelineGroups: Array<{
  window: RemovalWindow;
  title: string;
  description: string;
  tone: "danger" | "warning" | "default";
  limit: number;
}> = [
  {
    window: "overdue",
    title: "Overdue",
    description: "Past the calculated Remove Before date",
    tone: "danger",
    limit: 8,
  },
  {
    window: "today",
    title: "Remove Today",
    description: "Due during the current operating day",
    tone: "warning",
    limit: 8,
  },
  {
    window: "next3",
    title: "Next 3 Days",
    description: "Immediate upcoming removal workload",
    tone: "warning",
    limit: 8,
  },
  {
    window: "next7",
    title: "Next 7 Days",
    description: "Plan shelf and storage removals",
    tone: "default",
    limit: 8,
  },
  {
    window: "later",
    title: "Later",
    description: "Healthy forward batch inventory",
    tone: "default",
    limit: 10,
  },
];

function RemovalTimeline({
  rows,
  onSelect,
}: {
  rows: BatchIntelligenceRow[];
  onSelect: (row: BatchIntelligenceRow) => void;
}) {
  return (
    <div className="space-y-4">
      {timelineGroups.map((group) => {
        const groupRows = rows.filter(
          (row) => row.removalWindow === group.window
        );
        return (
          <Card
            key={group.window}
            className="gap-0 border-border/75 py-0 shadow-sm"
          >
            <CardHeader className="border-b px-4 py-4 sm:px-5">
              <SectionHeader
                title={group.title}
                description={group.description}
                action={
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md",
                      group.tone === "danger"
                        ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                        : group.tone === "warning"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {groupRows.length} batches
                  </Badge>
                }
              />
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {groupRows.length ? (
                <>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {groupRows.slice(0, group.limit).map((row) => (
                      <TimelineBatchCard
                        key={row.batch.id}
                        row={row}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                  {groupRows.length > group.limit ? (
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      {groupRows.length - group.limit} additional batches are
                      available in All Batches.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-5">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold">
                      No batches in this window
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No tracked inventory currently requires attention here.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TimelineBatchCard({
  row,
  onSelect,
}: {
  row: BatchIntelligenceRow;
  onSelect: (row: BatchIntelligenceRow) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(row)}
      className="group w-full rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/25 hover:bg-muted/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              row.risk === "critical"
                ? "bg-red-500/10 text-red-700 dark:text-red-400"
                : row.risk === "high"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "bg-primary/8 text-primary"
            )}
          >
            <Boxes className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{row.product.name}</p>
            <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
              {row.product.sku} · {row.batch.lotNumber} · {row.branch.name}
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniValue label="Removal" value={formatDate(row.batch.removalDate)} />
        <MiniValue label="Expiry" value={formatDate(row.batch.expiryDate)} />
        <MiniValue label="Remaining" value={`${row.batch.unitsOnHand} units`} />
        <MiniValue
          label="Velocity"
          value={`${row.salesVelocity.toFixed(1)}/day`}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <BatchStatusBadge status={row.status} />
        <FifoBadge label={row.fifoLabel} />
        <RiskBadge risk={row.risk} />
        {row.relatedActions.some((action) => action.status !== "completed") ? (
          <Badge variant="secondary" className="rounded-md text-[0.64rem]">
            <ListChecks className="mr-1 size-3" />
            Open action
          </Badge>
        ) : null}
      </div>
    </button>
  );
}

function BatchTable({
  rows,
  total,
  scopeLabel,
  onSelect,
}: {
  rows: BatchIntelligenceRow[];
  total: number;
  scopeLabel: string;
  onSelect: (row: BatchIntelligenceRow) => void;
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border/75 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Batch Register
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing {rows.length} of {total} matching batches · {scopeLabel}
          </p>
        </div>
        <Badge variant="secondary" className="rounded-md">
          Tracked products only
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-[1220px]">
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead className="pl-5">Product / Batch</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Expiry / Removal</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Velocity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>FIFO Position</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="w-20 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.batch.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => onSelect(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSelect(row);
                }}
              >
                <TableCell className="pl-5">
                  <p className="max-w-[14rem] truncate text-xs font-semibold">
                    {row.product.name}
                  </p>
                  <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                    {row.product.sku} · {row.batch.lotNumber} · {row.batch.id}
                  </p>
                </TableCell>
                <TableCell className="text-xs">{row.branch.name}</TableCell>
                <TableCell className="max-w-[11rem] truncate text-xs text-muted-foreground">
                  {row.supplier.name}
                </TableCell>
                <TableCell>
                  <p className="text-xs tabular-nums">
                    Exp {formatDate(row.batch.expiryDate)}
                  </p>
                  <p className="mt-0.5 text-[0.64rem] tabular-nums text-muted-foreground">
                    Remove {formatDate(row.batch.removalDate)}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-xs font-semibold tabular-nums">
                    {number.format(row.batch.unitsOnHand)}
                  </p>
                  <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                    of {number.format(row.batch.initialUnits)}
                  </p>
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {row.salesVelocity.toFixed(1)}/day
                </TableCell>
                <TableCell>
                  <BatchStatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <FifoBadge label={row.fifoLabel} />
                </TableCell>
                <TableCell>
                  <RiskBadge risk={row.risk} />
                </TableCell>
                <TableCell className="pr-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(row);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center">
                  <p className="text-sm font-medium">No matching batches</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Adjust the filters or include historical batches.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        {total > rows.length ? (
          <div className="border-t px-5 py-3 text-center text-xs text-muted-foreground">
            Refine the filters to view the remaining {total - rows.length}{" "}
            matching batches.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BatchDetailSheet({
  row,
  onOpenChange,
}: {
  row: BatchIntelligenceRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return <Sheet open={false} onOpenChange={onOpenChange} />;
  const openActions = row.relatedActions.filter(
    (action) => action.status !== "completed"
  );
  const lossValue = row.relatedLossEvents.reduce(
    (total, event) => total + event.value,
    0
  );
  return (
    <Sheet open={Boolean(row)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden sm:max-w-3xl">
        <SheetHeader className="border-b px-5 py-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
              <Boxes className="size-[1.1rem]" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{row.product.name}</SheetTitle>
                <BatchStatusBadge status={row.status} />
                <RiskBadge risk={row.risk} />
              </div>
              <SheetDescription className="mt-1">
                {row.batch.lotNumber} · {row.batch.id} · {row.branch.name}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailMeta label="Supplier" value={row.supplier.name} />
              <DetailMeta label="Source" value={row.source} />
              <DetailMeta
                label="Received"
                value={formatDate(row.batch.receivedDate)}
              />
              <DetailMeta
                label="Expiry"
                value={formatDate(row.batch.expiryDate)}
              />
              <DetailMeta
                label="Remove Before"
                value={`${row.product.removeBeforeDays ?? 0} days`}
              />
              <DetailMeta
                label="Calculated Removal"
                value={formatDate(row.calculatedRemovalDate)}
              />
              <DetailMeta
                label="Original Quantity"
                value={`${number.format(row.batch.initialUnits)} units`}
              />
              <DetailMeta
                label="Remaining Quantity"
                value={`${number.format(row.batch.unitsOnHand)} units`}
              />
              <DetailMeta
                label="Quantity Depleted"
                value={`${number.format(row.quantityDepleted)} units`}
              />
              <DetailMeta
                label="Sales Velocity"
                value={`${row.salesVelocity.toFixed(1)} units / day`}
              />
              <DetailMeta
                label="FIFO Position"
                value={fifoLabels[row.fifoLabel]}
              />
              <DetailMeta label="Operational Risk" value={row.risk} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ContextCard
                icon={ListChecks}
                label="Open Actions"
                value={String(openActions.length)}
                detail={openActions[0]?.typeLabel ?? "No batch action open"}
                tone={openActions.length ? "warning" : "success"}
              />
              <ContextCard
                icon={ShoppingCart}
                label="Confirmed FIFO History"
                value={String(row.confirmedFifoEvents)}
                detail="Physical product/branch events"
                tone={row.confirmedFifoEvents ? "warning" : "success"}
              />
              <ContextCard
                icon={CircleDollarSign}
                label="Related Loss Context"
                value={currency.format(lossValue)}
                detail={`${row.relatedLossEvents.length} product/branch events`}
                tone={lossValue ? "warning" : "success"}
              />
            </div>
            {openActions.length ? (
              <Card className="gap-0 border-border/75 py-0 shadow-none">
                <CardHeader className="border-b px-4 py-4">
                  <SectionHeader
                    title="Related Operational Actions"
                    description="Open work directly linked to this batch."
                  />
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {openActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <p className="text-xs font-semibold">
                          {action.typeLabel}
                        </p>
                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                          {action.reason}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-md capitalize"
                      >
                        {action.priority}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
            <Card className="gap-0 border-border/75 py-0 shadow-none">
              <CardHeader className="border-b px-4 py-4">
                <SectionHeader
                  title="Batch History"
                  description="Receiving, movement, action, and related operational events."
                />
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative before:absolute before:bottom-3 before:left-[0.95rem] before:top-3 before:w-px before:bg-border">
                  {row.timeline.map((item) => (
                    <TimelineEvent key={item.id} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button asChild className="w-full gap-2">
              <Link to={`/products/${row.product.id}`}>
                <PackageCheck className="size-4" />
                Open Product Intelligence
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const statusLabels: Record<BatchOperationalStatus, string> = {
  open: "Open",
  "remove-soon": "Remove Soon",
  "remove-today": "Remove Today",
  overdue: "Overdue",
  depleted: "Depleted",
  "removed-resolved": "Removed / Resolved",
};
const fifoLabels: Record<FifoLabel, string> = {
  "consume-first": "Consume First",
  next: "Next",
  later: "Later",
  closed: "Closed",
};

function BatchStatusBadge({ status }: { status: BatchOperationalStatus }) {
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
      {statusLabels[status]}
    </Badge>
  );
}
function FifoBadge({ label }: { label: FifoLabel }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md text-[0.64rem]",
        label === "consume-first"
          ? "border-primary/20 bg-primary/8 text-primary"
          : "bg-muted/60 text-muted-foreground"
      )}
    >
      {fifoLabels[label]}
    </Badge>
  );
}
function RiskBadge({ risk }: { risk: BatchRisk }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md text-[0.64rem] capitalize",
        risk === "critical"
          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
          : risk === "high"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : risk === "medium"
          ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      )}
    >
      {risk}
    </Badge>
  );
}

function BatchMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
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
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tones[tone]
          )}
        >
          <Icon className="size-[1.1rem]" />
        </span>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
            {detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
function MiniValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold tabular-nums">{value}</p>
    </div>
  );
}
function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-xs font-semibold capitalize leading-5">
        {value}
      </p>
    </div>
  );
}
function ContextCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "warning" | "success";
}) {
  return (
    <div className="rounded-lg border p-4">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          tone === "warning"
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        )}
      >
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[0.65rem] leading-5 text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

const timelineIconConfig: Record<
  BatchTimelineItem["type"],
  { icon: LucideIcon; className: string }
> = {
  received: {
    icon: Truck,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  information: {
    icon: ClipboardCheck,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  snapshot: { icon: Warehouse, className: "bg-primary/8 text-primary" },
  decrement: {
    icon: ArrowDownRight,
    className: "bg-muted text-muted-foreground",
  },
  recount: {
    icon: ShieldCheck,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  removal: {
    icon: CalendarClock,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  fifo: {
    icon: ShoppingCart,
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  expiry: {
    icon: AlertTriangle,
    className: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  depletion: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  correction: { icon: History, className: "bg-muted text-muted-foreground" },
};
function TimelineEvent({ item }: { item: BatchTimelineItem }) {
  const config = timelineIconConfig[item.type];
  const Icon = config.icon;
  return (
    <div className="relative grid gap-2 py-3 pl-12 sm:grid-cols-[8rem_1fr]">
      <span
        className={cn(
          "absolute left-0 z-10 flex size-8 items-center justify-center rounded-full border-4 border-card",
          config.className
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <p className="text-[0.68rem] font-medium tabular-nums">
        {formatDate(item.occurredAt)}
      </p>
      <div>
        <p className="text-xs font-semibold">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  items,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn("w-full bg-background", className)}
        aria-label={placeholder}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
