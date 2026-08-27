import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  ListChecks,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";

import { ALL_BRANCHES_ID, useBranch } from "@/components/nems/branch-context";
import { useActionResolutions } from "@/components/nems/action-resolution-context";
import { SectionHeader } from "@/components/nems/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SheetFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  actionCenterItems,
  actionTypeLabels,
  type ActionCenterItem,
  type ActionCenterType,
  type ActionTiming,
} from "@/mock/action-center";
import { branches, categories, DEMO_TODAY } from "@/mock/nems-data";

type StatusFilter =
  | "open"
  | "all"
  | "overdue"
  | "due-today"
  | "upcoming"
  | "in-progress"
  | "completed";

const number = new Intl.NumberFormat("en-US");
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(value: string | undefined) {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

export function ActionCenterPage() {
  const { selectedBranchId, setSelectedBranchId } = useBranch();
  const { resolvedActions, resolveAction } = useActionResolutions();
  const [branchFilter, setBranchFilter] = useState(selectedBranchId);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [selectedAction, setSelectedAction] = useState<ActionCenterItem | null>(
    null
  );

  useEffect(() => {
    setBranchFilter(selectedBranchId);
  }, [selectedBranchId]);

  const isCompleted = (action: ActionCenterItem) =>
    action.status === "completed" || Boolean(resolvedActions[action.id]);
  const getTiming = (action: ActionCenterItem): ActionTiming =>
    isCompleted(action) ? "completed" : action.timing;

  const scopedActions = useMemo(
    () =>
      actionCenterItems.filter(
        (action) =>
          branchFilter === ALL_BRANCHES_ID || action.branch.id === branchFilter
      ),
    [branchFilter]
  );

  const assignees = useMemo(
    () =>
      Array.from(
        new Set(scopedActions.map((action) => action.assignedTo))
      ).sort(),
    [scopedActions]
  );

  const filteredActions = scopedActions
    .filter((action) => {
      const normalizedSearch = search.trim().toLowerCase();
      const completed = isCompleted(action);
      const timing = getTiming(action);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && !completed) ||
        (statusFilter === "completed" && completed) ||
        (statusFilter === "in-progress" &&
          !completed &&
          action.status === "in-progress") ||
        (statusFilter === timing && !completed);

      return (
        (!normalizedSearch ||
          action.product.name.toLowerCase().includes(normalizedSearch) ||
          action.product.sku.toLowerCase().includes(normalizedSearch) ||
          action.product.id.toLowerCase().includes(normalizedSearch) ||
          action.product.barcode.includes(normalizedSearch) ||
          action.id.toLowerCase().includes(normalizedSearch) ||
          action.batch?.id.toLowerCase().includes(normalizedSearch) ||
          action.batch?.lotNumber.toLowerCase().includes(normalizedSearch)) &&
        (typeFilter === "all" || action.type === typeFilter) &&
        (priorityFilter === "all" || action.priority === priorityFilter) &&
        matchesStatus &&
        (categoryFilter === "all" ||
          action.product.categoryId === categoryFilter) &&
        (assigneeFilter === "all" || action.assignedTo === assigneeFilter)
      );
    })
    .sort((a, b) => {
      const completedDifference =
        Number(isCompleted(a)) - Number(isCompleted(b));
      if (completedDifference) return completedDifference;
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      const priorityDifference =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDifference) return priorityDifference;
      return a.dueAt.localeCompare(b.dueAt);
    });

  const openActions = scopedActions.filter((action) => !isCompleted(action));
  const criticalCount = openActions.filter(
    (action) => action.priority === "critical"
  ).length;
  const overdueCount = openActions.filter(
    (action) => getTiming(action) === "overdue"
  ).length;
  const dueTodayCount = openActions.filter(
    (action) => getTiming(action) === "due-today"
  ).length;
  const completedActions = scopedActions.filter(isCompleted);
  const onTimeCompleted = completedActions.filter((action) => {
    if (resolvedActions[action.id]) return action.timing !== "overdue";
    return Boolean(action.completedAt && action.completedAt <= action.dueAt);
  }).length;
  const actionCompliance =
    (onTimeCompleted / Math.max(completedActions.length, 1)) * 100;
  const scopeLabel =
    branchFilter === ALL_BRANCHES_ID
      ? "All Branches"
      : branches.find((branch) => branch.id === branchFilter)?.name ??
        "All Branches";
  const typeCounts = Object.entries(actionTypeLabels).map(([type, label]) => ({
    type: type as ActionCenterType,
    label,
    count: openActions.filter((action) => action.type === type).length,
  }));
  const hasFilters =
    search ||
    typeFilter !== "all" ||
    priorityFilter !== "all" ||
    statusFilter !== "open" ||
    categoryFilter !== "all" ||
    assigneeFilter !== "all" ||
    branchFilter !== selectedBranchId;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPriorityFilter("all");
    setStatusFilter("open");
    setCategoryFilter("all");
    setAssigneeFilter("all");
    setBranchFilter(selectedBranchId);
  };

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
            <ListChecks className="size-4" />
            Operations
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Action Center
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            Prioritized operational work explaining what needs attention, why
            NEMS created it, and how to resolve it.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit rounded-md border-primary/20 bg-primary/5 px-2.5 py-1 text-primary"
        >
          {scopeLabel} · {formatActionCount(openActions.length, "open")}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <WorkloadMetric
          label="Critical Actions"
          value={criticalCount}
          detail="Highest-priority work"
          icon={ShieldAlert}
          tone="danger"
        />
        <WorkloadMetric
          label="Overdue"
          value={overdueCount}
          detail="Past due time"
          icon={AlertTriangle}
          tone="danger"
        />
        <WorkloadMetric
          label="Due Today"
          value={dueTodayCount}
          detail={DEMO_TODAY}
          icon={Clock3}
          tone="warning"
        />
        <WorkloadMetric
          label="Total Open"
          value={openActions.length}
          detail={`${
            openActions.filter((action) => action.status === "in-progress")
              .length
          } in progress`}
          icon={ListChecks}
        />
        <WorkloadMetric
          label="Action Compliance"
          value={`${actionCompliance.toFixed(1)}%`}
          detail={`${onTimeCompleted} of ${completedActions.length} on time`}
          icon={ClipboardCheck}
          tone="success"
        />
      </div>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <SectionHeader
            title="Open Workload by Type"
            description="A compact view of the current operating mix."
          />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 p-4 sm:px-5">
          {typeCounts.map((item) => {
            const Icon = actionTypeConfig[item.type].icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  setTypeFilter(item.type);
                  setStatusFilter("open");
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-muted/60",
                  typeFilter === item.type &&
                    "border-primary/30 bg-primary/5 text-primary"
                )}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 font-semibold tabular-nums">
                  {item.count}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_repeat(3,minmax(10rem,0.42fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product, SKU, barcode, batch, or action ID..."
                className="pl-9"
                aria-label="Search actions"
              />
            </div>
            <FilterSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              placeholder="Action type"
              items={[
                { value: "all", label: "All action types" },
                ...Object.entries(actionTypeLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <FilterSelect
              value={priorityFilter}
              onValueChange={setPriorityFilter}
              placeholder="Priority"
              items={[
                { value: "all", label: "All priorities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
              ]}
            />
            <FilterSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              placeholder="Status"
              items={[
                { value: "open", label: "Open queue" },
                { value: "all", label: "All states" },
                { value: "overdue", label: "Overdue" },
                { value: "due-today", label: "Due today" },
                { value: "upcoming", label: "Upcoming" },
                { value: "in-progress", label: "In progress" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(10rem,0.42fr))_1fr]">
            <FilterSelect
              value={branchFilter}
              onValueChange={(value) => {
                setBranchFilter(value);
                setSelectedBranchId(value);
              }}
              placeholder="Branch"
              items={[
                { value: ALL_BRANCHES_ID, label: "All Branches" },
                ...branches.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
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
              value={assigneeFilter}
              onValueChange={setAssigneeFilter}
              placeholder="Assigned person"
              items={[
                { value: "all", label: "All assignees" },
                ...assignees.map((assignee) => ({
                  value: assignee,
                  label: assignee,
                })),
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

      <Card className="gap-0 overflow-hidden border-border/75 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Operational Work Queue
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatActionCount(filteredActions.length)} · {scopeLabel}
            </p>
          </div>
          <Badge variant="secondary" className="rounded-md">
            Tracked products only
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[1320px]">
            <TableHeader>
              <TableRow className="bg-muted/35 hover:bg-muted/35">
                <TableHead className="pl-5">Priority / Status</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Why it needs attention</TableHead>
                <TableHead>Batch / Quantity</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="w-24 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.map((action) => (
                <TableRow
                  key={action.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedAction(action)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setSelectedAction(action);
                  }}
                >
                  <TableCell className="pl-5">
                    <div className="flex flex-col items-start gap-1.5">
                      <PriorityBadge priority={action.priority} />
                      <TimingBadge timing={getTiming(action)} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <ActionTypeIcon type={action.type} />
                      <div>
                        <p className="text-xs font-semibold">
                          {action.typeLabel}
                        </p>
                        <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                          {action.id} · Created{" "}
                          {formatDateTime(action.createdAt)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[12rem] truncate text-xs font-semibold">
                      {action.product.name}
                    </p>
                    <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                      {action.product.sku} · {action.product.id}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">
                    {action.branch.name}
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[19rem] text-xs leading-5 text-muted-foreground">
                      {action.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    {action.batch ? (
                      <>
                        <p className="text-xs font-medium">
                          {action.batch.lotNumber}
                        </p>
                        <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                          {action.quantity ??
                            action.decrementQuantity ??
                            action.expectedStock}{" "}
                          units
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No batch linked
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-medium tabular-nums">
                      {formatDateTime(action.dueAt)}
                    </p>
                    <p className="mt-0.5 text-[0.64rem] capitalize text-muted-foreground">
                      {isCompleted(action)
                        ? "Completed"
                        : action.status.replace("-", " ")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <UserRound className="size-3.5 text-muted-foreground" />
                      {action.assignedTo}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedAction(action);
                      }}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredActions.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <p className="text-sm font-medium">No matching actions</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Adjust the filters or view completed work.
                    </p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ActionDetailsSheet
        action={selectedAction}
        completed={selectedAction ? isCompleted(selectedAction) : false}
        onOpenChange={(open) => !open && setSelectedAction(null)}
        onResolve={(action, resolution) => {
          resolveAction(action.id, resolution.outcome, resolution.note);
          setSelectedAction(null);
          toast.success(`${action.typeLabel} completed`, {
            description: `${action.product.name} · ${action.branch.name}`,
          });
        }}
      />
    </section>
  );
}

const actionTypeConfig: Record<
  ActionCenterType,
  { icon: LucideIcon; className: string }
> = {
  "expiry-removal": {
    icon: CalendarClock,
    className: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  "missing-batch-information": {
    icon: FileQuestion,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  recount: {
    icon: RefreshCw,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  "unassigned-decrement": {
    icon: ArrowDownToLine,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  "transfer-arrival": {
    icon: Truck,
    className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  },
  "fifo-verification": {
    icon: Boxes,
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  "urgent-operational-check": {
    icon: AlertCircle,
    className: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
};

function ActionDetailsSheet({
  action,
  completed,
  onOpenChange,
  onResolve,
}: {
  action: ActionCenterItem | null;
  completed: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (
    action: ActionCenterItem,
    resolution: { outcome: string; note?: string }
  ) => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fifoResult, setFifoResult] = useState("");
  const [candidateBatchId, setCandidateBatchId] = useState("");

  useEffect(() => {
    if (!action) return;
    setQuantity(String(action.quantity ?? action.expectedStock ?? ""));
    setExpiryDate(
      action.type === "transfer-arrival" ? action.batch?.expiryDate ?? "" : ""
    );
    setNotes("");
    setFifoResult("");
    setCandidateBatchId(action.candidateBatches[0]?.id ?? "");
  }, [action]);

  if (!action) return <Sheet open={false} onOpenChange={onOpenChange} />;
  const valid = getResolutionValidity(
    action,
    quantity,
    expiryDate,
    fifoResult,
    candidateBatchId
  );

  return (
    <Sheet open={Boolean(action)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden sm:max-w-2xl">
        <SheetHeader className="border-b px-5 py-5 pr-12">
          <div className="flex items-start gap-3">
            <ActionTypeIcon type={action.type} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{action.typeLabel}</SheetTitle>
                <PriorityBadge priority={action.priority} />
                <TimingBadge timing={completed ? "completed" : action.timing} />
              </div>
              <SheetDescription className="mt-1">
                {action.product.name} · {action.branch.name} · {action.id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailMeta
                label="Product"
                value={`${action.product.name} · ${action.product.sku}`}
              />
              <DetailMeta
                label="Batch"
                value={
                  action.batch
                    ? `${action.batch.lotNumber} · ${action.batch.id}`
                    : "Not yet linked"
                }
              />
              <DetailMeta
                label="Created"
                value={formatDateTime(action.createdAt)}
              />
              <DetailMeta label="Due" value={formatDateTime(action.dueAt)} />
              <DetailMeta label="Assigned to" value={action.assignedTo} />
              <DetailMeta
                label="Workflow status"
                value={
                  completed
                    ? "Completed"
                    : action.status === "in-progress"
                    ? "In progress"
                    : "Open"
                }
              />
            </div>

            <Button asChild variant="outline" className="w-full gap-2 sm:w-fit">
              <Link to={`/products/${action.product.id}`}>
                <PackageCheck className="size-4" />
                View Product Intelligence
              </Link>
            </Button>

            <ExplanationSection eyebrow="WHY NEMS CREATED THIS">
              <p className="text-sm leading-6 text-foreground/85">
                {action.why}
              </p>
            </ExplanationSection>
            <ExplanationSection eyebrow="EVIDENCE">
              <div className="grid gap-2 sm:grid-cols-2">
                {action.evidence.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border bg-muted/25 p-3"
                  >
                    <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </ExplanationSection>
            <ExplanationSection eyebrow="RECOMMENDED ACTION">
              <p className="text-sm leading-6 text-foreground/85">
                {action.recommendedAction}
              </p>
            </ExplanationSection>

            {completed ? (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Action completed
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This action remains available as recent operational history.
                  </p>
                </div>
              </div>
            ) : (
              <ResolutionForm
                action={action}
                quantity={quantity}
                setQuantity={setQuantity}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                notes={notes}
                setNotes={setNotes}
                fifoResult={fifoResult}
                setFifoResult={setFifoResult}
                candidateBatchId={candidateBatchId}
                setCandidateBatchId={setCandidateBatchId}
              />
            )}
          </div>
        </div>
        {!completed ? (
          <SheetFooter className="border-t bg-background px-5 py-4">
            <Button
              disabled={!valid}
              onClick={() =>
                onResolve(action, {
                  outcome: getResolutionOutcome(
                    action,
                    quantity,
                    expiryDate,
                    fifoResult,
                    candidateBatchId
                  ),
                  note: notes,
                })
              }
              className="w-full gap-2"
            >
              <CheckCircle2 className="size-4" />
              {getResolutionButtonLabel(action.type)}
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ResolutionForm({
  action,
  quantity,
  setQuantity,
  expiryDate,
  setExpiryDate,
  notes,
  setNotes,
  fifoResult,
  setFifoResult,
  candidateBatchId,
  setCandidateBatchId,
}: {
  action: ActionCenterItem;
  quantity: string;
  setQuantity: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  fifoResult: string;
  setFifoResult: (value: string) => void;
  candidateBatchId: string;
  setCandidateBatchId: (value: string) => void;
}) {
  const calculatedRemovalDate = expiryDate
    ? shiftDate(expiryDate, -(action.product.removeBeforeDays ?? 3))
    : "";
  return (
    <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
      <p className="text-sm font-semibold">Resolve action</p>
      <div className="mt-4 space-y-4">
        {action.type === "expiry-removal" ? (
          <NumberField
            id="removed-quantity"
            label="Confirmed removed quantity"
            value={quantity}
            onChange={setQuantity}
            hint={`Expected removal: ${action.quantity ?? 0} units`}
          />
        ) : null}
        {action.type === "recount" ? (
          <NumberField
            id="counted-stock"
            label="Counted stock"
            value={quantity}
            onChange={setQuantity}
            hint={`Expected stock: ${action.expectedStock} units`}
          />
        ) : null}
        {action.type === "missing-batch-information" ? (
          <>
            <NumberField
              id="batch-quantity"
              label="Received quantity"
              value={quantity}
              onChange={setQuantity}
            />
            <DateField
              id="batch-expiry"
              label="Expiry date"
              value={expiryDate}
              onChange={setExpiryDate}
            />
          </>
        ) : null}
        {action.type === "transfer-arrival" ? (
          <>
            <NumberField
              id="received-quantity"
              label="Confirmed received quantity"
              value={quantity}
              onChange={setQuantity}
              hint={`Expected: ${action.quantity ?? 0} units`}
            />
            <DateField
              id="transfer-expiry"
              label="Expiry date"
              value={expiryDate}
              onChange={setExpiryDate}
            />
            <div className="rounded-lg border bg-background p-3">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Calculated removal date
              </p>
              <p className="mt-1.5 text-xs font-semibold">
                {calculatedRemovalDate || "Enter expiry date"}
              </p>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                Remove Before: {action.product.removeBeforeDays ?? 3} days
              </p>
            </div>
          </>
        ) : null}
        {action.type === "fifo-verification" ? (
          <div>
            <Label>Verification result</Label>
            <Select value={fifoResult} onValueChange={setFifoResult}>
              <SelectTrigger className="mt-2 w-full bg-background">
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correct">FIFO correct</SelectItem>
                <SelectItem value="violation">
                  FIFO violation confirmed
                </SelectItem>
                <SelectItem value="unable">Unable to verify</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              The check itself is not a confirmed violation. Select the physical
              result observed.
            </p>
          </div>
        ) : null}
        {action.type === "unassigned-decrement" ? (
          <div>
            <Label>Assign decrement to batch</Label>
            <Select
              value={candidateBatchId}
              onValueChange={setCandidateBatchId}
            >
              <SelectTrigger className="mt-2 w-full bg-background">
                <SelectValue placeholder="Select candidate batch" />
              </SelectTrigger>
              <SelectContent>
                {action.candidateBatches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.lotNumber} · {batch.unitsOnHand} units
                  </SelectItem>
                ))}
                <SelectItem value="escalate">
                  No eligible batch — escalate
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              Decrement to assign: {action.decrementQuantity} units
            </p>
          </div>
        ) : null}
        {action.type === "urgent-operational-check" ? (
          <div className="rounded-lg border bg-background p-3 text-xs leading-5 text-muted-foreground">
            Inspect shelf, storage, and the batch record. Document the observed
            condition below before completion.
          </div>
        ) : null}
        <div>
          <Label htmlFor={`notes-${action.id}`}>Optional note</Label>
          <Textarea
            id={`notes-${action.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add resolution context..."
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

function WorkloadMetric({
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

function ActionTypeIcon({ type }: { type: ActionCenterType }) {
  const config = actionTypeConfig[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        config.className
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: ActionCenterItem["priority"];
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md text-[0.64rem] capitalize",
        priority === "critical"
          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
          : priority === "high"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400"
      )}
    >
      {priority}
    </Badge>
  );
}

function TimingBadge({ timing }: { timing: ActionTiming }) {
  const labels: Record<ActionTiming, string> = {
    overdue: "Overdue",
    "due-today": "Due today",
    upcoming: "Upcoming",
    completed: "Completed",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md text-[0.64rem]",
        timing === "overdue"
          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
          : timing === "due-today"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : timing === "completed"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {labels[timing]}
    </Badge>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  items,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full bg-background" aria-label={placeholder}>
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

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-xs font-semibold leading-5">{value}</p>
    </div>
  );
}

function ExplanationSection({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 bg-background"
      />
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 bg-background"
      />
    </div>
  );
}

function getResolutionValidity(
  action: ActionCenterItem,
  quantity: string,
  expiryDate: string,
  fifoResult: string,
  candidateBatchId: string
) {
  if (
    action.type === "missing-batch-information" ||
    action.type === "transfer-arrival"
  )
    return Number(quantity) > 0 && Boolean(expiryDate);
  if (action.type === "expiry-removal" || action.type === "recount")
    return quantity !== "" && Number(quantity) >= 0;
  if (action.type === "fifo-verification") return Boolean(fifoResult);
  if (action.type === "unassigned-decrement") return Boolean(candidateBatchId);
  return true;
}

function formatActionCount(count: number, qualifier?: string) {
  const descriptor = qualifier ? ` ${qualifier}` : "";
  return `${count}${descriptor} action${count === 1 ? "" : "s"}`;
}

function getResolutionOutcome(
  action: ActionCenterItem,
  quantity: string,
  expiryDate: string,
  fifoResult: string,
  candidateBatchId: string
) {
  if (action.type === "expiry-removal")
    return `${Number(quantity)} units removed and confirmed.`;
  if (action.type === "recount")
    return `Physical count confirmed at ${Number(quantity)} units.`;
  if (action.type === "missing-batch-information")
    return `Batch information confirmed: ${Number(quantity)} units, expiry ${expiryDate}.`;
  if (action.type === "transfer-arrival")
    return `Transfer arrival confirmed: ${Number(quantity)} units, expiry ${expiryDate}.`;
  if (action.type === "fifo-verification") {
    if (fifoResult === "correct") return "FIFO sequence verified as correct.";
    if (fifoResult === "violation")
      return "FIFO violation confirmed during physical verification.";
    return "Physical FIFO sequence could not be verified.";
  }
  if (action.type === "unassigned-decrement")
    return candidateBatchId === "escalate"
      ? "Unassigned decrement escalated for supervisor review."
      : `Unassigned decrement linked to ${candidateBatchId}.`;
  return "Operational check completed.";
}

function getResolutionButtonLabel(type: ActionCenterType) {
  if (type === "expiry-removal") return "Resolve removal";
  if (type === "recount") return "Complete recount";
  if (type === "missing-batch-information") return "Save batch information";
  if (type === "transfer-arrival") return "Complete arrival";
  if (type === "fifo-verification") return "Complete FIFO check";
  if (type === "unassigned-decrement") return "Assign and resolve";
  return "Complete operational check";
}

const DAY_MS = 86_400_000;
function shiftDate(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}
