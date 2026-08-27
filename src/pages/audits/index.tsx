import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  Ban,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  FileClock,
  FilterX,
  History,
  ListChecks,
  PackageCheck,
  PencilLine,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import { useActionResolutions } from "@/components/nems/action-resolution-context";
import { ALL_BRANCHES_ID, useBranch } from "@/components/nems/branch-context";
import { SectionHeader } from "@/components/nems/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  auditActors,
  auditEntityTypes,
  auditEvents,
  auditEventTypeLabels,
  type AuditEvent,
  type AuditEventStatus,
  type AuditEventType,
} from "@/mock/audit-history";
import { actionCenterItems } from "@/mock/action-center";
import { DEMO_TODAY, branches } from "@/mock/nems-data";

type EventOverrides = Record<string, AuditEventStatus>;
type ChangeMode = "correction" | "reversal" | null;

const DAY_MS = 86_400_000;

export function AuditsPage() {
  const { selectedBranchId, setSelectedBranchId, isAllBranches } = useBranch();
  const { resolvedActions } = useActionResolutions();
  const [branchFilter, setBranchFilter] = useState(selectedBranchId);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("30");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [eventOverrides, setEventOverrides] = useState<EventOverrides>({});
  const [changeMode, setChangeMode] = useState<ChangeMode>(null);
  const [changeValue, setChangeValue] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [changeNote, setChangeNote] = useState("");

  useEffect(() => {
    setBranchFilter(selectedBranchId);
  }, [selectedBranchId]);

  const sessionResolutionEvents = useMemo<AuditEvent[]>(
    () =>
      Object.values(resolvedActions).flatMap((resolution) => {
        const action = actionCenterItems.find(
          (item) => item.id === resolution.actionId
        );
        if (!action) return [];
        return [
          {
            id: `AUD-SESSION-${action.id}`,
            timestamp: resolution.completedAt,
            type: "action-completed",
            status: "completed",
            actor: action.assignedTo,
            actorRole: "Branch operator",
            actorKind: "operator",
            branch: action.branch,
            entityType: "Action",
            product: action.product,
            batch: action.batch,
            action,
            description: `${action.typeLabel} completed for ${action.product.name}.`,
            previousValue: "Open",
            newValue: "Completed",
            quantity: action.quantity ?? undefined,
            outcome: resolution.outcome,
            reason: action.reason,
            note: resolution.note ?? "Completed during the current operating session.",
            canCorrect: false,
            canReverse: false,
          } satisfies AuditEvent,
        ];
      }),
    [resolvedActions]
  );

  const allEvents = useMemo(
    () =>
      [...localEvents, ...sessionResolutionEvents, ...auditEvents]
        .map((event) => ({
          ...event,
          status: eventOverrides[event.id] ?? event.status,
        }))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [eventOverrides, localEvents, sessionResolutionEvents]
  );

  const branchEvents = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          branchFilter === ALL_BRANCHES_ID || event.branch.id === branchFilter
      ),
    [allEvents, branchFilter]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return branchEvents.filter((event) => {
      const searchable = [
        event.id,
        event.product?.name,
        event.product?.id,
        event.product?.sku,
        event.product?.barcode,
        event.batch?.id,
        event.batch?.lotNumber,
        event.action?.id,
        event.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (eventTypeFilter === "all" || event.type === eventTypeFilter) &&
        (actorFilter === "all" || event.actor === actorFilter) &&
        (entityFilter === "all" || event.entityType === entityFilter) &&
        (statusFilter === "all" || event.status === statusFilter) &&
        withinPeriod(event.timestamp, periodFilter)
      );
    });
  }, [
    actorFilter,
    branchEvents,
    entityFilter,
    eventTypeFilter,
    periodFilter,
    search,
    statusFilter,
  ]);

  const selectedEvent =
    allEvents.find((event) => event.id === selectedEventId) ?? null;
  const recentChanges = branchEvents
    .filter((event) =>
      ["correction", "reversal", "cancellation"].includes(event.type)
    )
    .slice(0, 5);
  const eventsToday = branchEvents.filter(
    (event) => event.timestamp.slice(0, 10) === DEMO_TODAY
  ).length;
  const corrections = branchEvents.filter(
    (event) => event.type === "correction"
  ).length;
  const reversals = branchEvents.filter((event) =>
    ["reversal", "cancellation"].includes(event.type)
  ).length;
  const activeOperators = new Set(
    branchEvents
      .filter(
        (event) =>
          event.timestamp.slice(0, 10) >= shiftDate(DEMO_TODAY, -7) &&
          event.actorKind !== "system"
      )
      .map((event) => event.actor)
  ).size;
  const hasFilters =
    search !== "" ||
    eventTypeFilter !== "all" ||
    actorFilter !== "all" ||
    entityFilter !== "all" ||
    statusFilter !== "all" ||
    periodFilter !== "30";

  const clearFilters = () => {
    setSearch("");
    setEventTypeFilter("all");
    setActorFilter("all");
    setEntityFilter("all");
    setStatusFilter("all");
    setPeriodFilter("30");
  };

  const openChangeDialog = (mode: Exclude<ChangeMode, null>) => {
    if (!selectedEvent) return;
    setChangeMode(mode);
    setChangeValue(
      mode === "correction"
        ? selectedEvent.quantity?.toString() ?? selectedEvent.newValue ?? ""
        : ""
    );
    setChangeReason("");
    setChangeNote("");
  };

  const recordChange = () => {
    if (!selectedEvent || !changeMode || !changeReason.trim()) return;
    if (changeMode === "correction" && !changeValue.trim()) return;
    const isCancellation =
      changeMode === "reversal" &&
      selectedEvent.reversalMode === "cancellation";
    const eventType: AuditEventType =
      changeMode === "correction"
        ? "correction"
        : isCancellation
        ? "cancellation"
        : "reversal";
    const originalStatus: AuditEventStatus =
      changeMode === "correction"
        ? "corrected"
        : isCancellation
        ? "cancelled"
        : "reversed";
    const sequence = localEvents.length + 1;
    const newEvent: AuditEvent = {
      ...selectedEvent,
      id: `AUD-LOCAL-${eventType.slice(0, 3).toUpperCase()}-${String(
        sequence
      ).padStart(4, "0")}`,
      timestamp: `${DEMO_TODAY}T17:${String(10 + sequence).padStart(
        2,
        "0"
      )}:00`,
      type: eventType,
      status: "completed",
      actor: selectedEvent.branch.manager,
      actorRole: "Branch supervisor",
      actorKind: "supervisor",
      description:
        changeMode === "correction"
          ? `${
              selectedEvent.correctableField ?? "Recorded value"
            } corrected without removing the original event.`
          : `${
              isCancellation ? "Action cancelled" : "Operation reversed"
            } without removing the original event.`,
      previousValue: selectedEvent.newValue,
      newValue:
        changeMode === "correction"
          ? changeValue.trim()
          : isCancellation
          ? "Action cancelled"
          : "Operation reversed",
      quantity:
        changeMode === "correction" && Number.isFinite(Number(changeValue))
          ? Number(changeValue)
          : undefined,
      reason: changeReason.trim(),
      note: changeNote.trim() || "Manual management change recorded.",
      sourceEventId: selectedEvent.id,
      canCorrect: false,
      canReverse: false,
    };
    setEventOverrides((current) => ({
      ...current,
      [selectedEvent.id]: originalStatus,
    }));
    setLocalEvents((current) => [newEvent, ...current]);
    setSelectedEventId(newEvent.id);
    setChangeMode(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Control
        </div>
        <div className="mt-2 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Audit / System History
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              A traceable record of who changed what, when, and why across{" "}
              {isAllBranches ? "the NEMS network" : "the selected branch"}.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit gap-2 rounded-md px-3 py-1.5 text-xs"
          >
            <FileClock className="size-3.5 text-primary" />
            Append-only system history
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AuditMetric
          label="Events Today"
          value={eventsToday}
          detail="Recorded in current scope"
          icon={CalendarClock}
        />
        <AuditMetric
          label="Corrections"
          value={corrections}
          detail="Original records retained"
          icon={PencilLine}
          tone="warning"
        />
        <AuditMetric
          label="Reversals"
          value={reversals}
          detail="Reversals and cancellations"
          icon={Undo2}
          tone="danger"
        />
        <AuditMetric
          label="Active Operators"
          value={activeOperators}
          detail="Manual actors in last 7 days"
          icon={Users}
          tone="success"
        />
      </div>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <SectionHeader
            title="Recent Corrections & Reversals"
            description="Latest management changes to previously recorded operations."
          />
        </CardHeader>
        <CardContent className="p-0">
          {recentChanges.length ? (
            <div className="grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {recentChanges.slice(0, 4).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className="flex min-w-0 items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <EventIcon type={event.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {auditEventTypeLabels[event.type]}
                      </p>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {event.product?.name ?? event.entityType} ·{" "}
                      {event.branch.name}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState message="No corrections or reversals in this branch scope." />
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="space-y-4 border-b px-5 py-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <CardTitle className="text-base">System Event History</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredEvents.length} matching events · newest first
              </p>
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product, SKU, barcode, batch, action, event…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              value={branchFilter}
              onValueChange={(value) => {
                setBranchFilter(value);
                setSelectedBranchId(value);
              }}
              placeholder="Branch"
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
              value={eventTypeFilter}
              onValueChange={setEventTypeFilter}
              placeholder="Event type"
              options={[
                { value: "all", label: "All event types" },
                ...Object.entries(auditEventTypeLabels).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                ),
              ]}
            />
            <FilterSelect
              value={actorFilter}
              onValueChange={setActorFilter}
              placeholder="User / operator"
              options={[
                { value: "all", label: "All users" },
                ...auditActors.map((actor) => ({ value: actor, label: actor })),
              ]}
            />
            <FilterSelect
              value={entityFilter}
              onValueChange={setEntityFilter}
              placeholder="Entity"
              options={[
                { value: "all", label: "All entities" },
                ...auditEntityTypes.map((entity) => ({
                  value: entity,
                  label: entity,
                })),
              ]}
            />
            <FilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "recorded", label: "Recorded" },
                { value: "completed", label: "Completed" },
                { value: "open", label: "Open" },
                { value: "corrected", label: "Corrected" },
                { value: "reversed", label: "Reversed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
            <FilterSelect
              value={periodFilter}
              onValueChange={setPeriodFilter}
              placeholder="Period"
              options={[
                { value: "today", label: "Today" },
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
                { value: "all", label: "All history" },
              ]}
            />
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <FilterX className="size-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AuditTable
            events={filteredEvents.slice(0, 150)}
            total={filteredEvents.length}
            showBranch={branchFilter === ALL_BRANCHES_ID}
            onSelect={(event) => setSelectedEventId(event.id)}
          />
        </CardContent>
      </Card>

      <AuditEventSheet
        event={selectedEvent}
        allEvents={allEvents}
        onOpenChange={(open) => !open && setSelectedEventId(null)}
        onSelectLinked={setSelectedEventId}
        onCorrect={() => openChangeDialog("correction")}
        onReverse={() => openChangeDialog("reversal")}
      />
      <ChangeDialog
        mode={changeMode}
        event={selectedEvent}
        value={changeValue}
        setValue={setChangeValue}
        reason={changeReason}
        setReason={setChangeReason}
        note={changeNote}
        setNote={setChangeNote}
        onOpenChange={(open) => !open && setChangeMode(null)}
        onSubmit={recordChange}
      />
    </div>
  );
}

function AuditTable({
  events,
  total,
  showBranch,
  onSelect,
}: {
  events: AuditEvent[];
  total: number;
  showBranch: boolean;
  onSelect: (event: AuditEvent) => void;
}) {
  if (!events.length)
    return <EmptyState message="No audit events match the current filters." />;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-36 pl-5">Timestamp</TableHead>
            <TableHead className="min-w-52">Event</TableHead>
            <TableHead className="min-w-40">User / Source</TableHead>
            {showBranch ? (
              <TableHead className="min-w-36">Branch</TableHead>
            ) : null}
            <TableHead className="min-w-56">Related Entity</TableHead>
            <TableHead className="min-w-64">Change / Result</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12 pr-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              tabIndex={0}
              onClick={() => onSelect(event)}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === "Enter") onSelect(event);
              }}
              className="cursor-pointer align-top"
            >
              <TableCell className="pl-5 text-xs tabular-nums text-muted-foreground">
                {formatDateTime(event.timestamp)}
              </TableCell>
              <TableCell>
                <div className="flex items-start gap-2.5">
                  <EventIcon type={event.type} size="small" />
                  <div>
                    <p className="text-xs font-semibold">
                      {auditEventTypeLabels[event.type]}
                    </p>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground">
                      {event.id}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-xs font-medium">{event.actor}</p>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  {event.actorRole}
                </p>
              </TableCell>
              {showBranch ? (
                <TableCell className="text-xs font-medium">
                  {event.branch.name}
                </TableCell>
              ) : null}
              <TableCell>
                <p className="text-xs font-medium">
                  {event.product?.name ?? event.entityType}
                </p>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  {[
                    event.product?.sku,
                    event.batch?.lotNumber,
                    event.action?.id,
                  ]
                    .filter(Boolean)
                    .join(" · ") || event.entityType}
                </p>
              </TableCell>
              <TableCell>
                <p className="line-clamp-2 text-xs leading-5 text-foreground/85">
                  {event.description}
                </p>
              </TableCell>
              <TableCell>
                <AuditStatusBadge status={event.status} />
              </TableCell>
              <TableCell className="pr-5">
                <ChevronRight className="size-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {total > events.length ? (
        <div className="border-t px-5 py-3 text-center text-xs text-muted-foreground">
          Refine the filters to view the remaining {total - events.length}{" "}
          events.
        </div>
      ) : null}
    </div>
  );
}

function AuditEventSheet({
  event,
  allEvents,
  onOpenChange,
  onSelectLinked,
  onCorrect,
  onReverse,
}: {
  event: AuditEvent | null;
  allEvents: AuditEvent[];
  onOpenChange: (open: boolean) => void;
  onSelectLinked: (id: string) => void;
  onCorrect: () => void;
  onReverse: () => void;
}) {
  if (!event) return <Sheet open={false} onOpenChange={onOpenChange} />;
  const sourceEvent = event.sourceEventId
    ? allEvents.find((item) => item.id === event.sourceEventId)
    : null;
  const linkedChanges = allEvents.filter(
    (item) => item.sourceEventId === event.id
  );
  const canModify = !["corrected", "reversed", "cancelled"].includes(
    event.status
  );
  return (
    <Sheet open={Boolean(event)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden sm:max-w-3xl">
        <SheetHeader className="border-b px-5 py-5 pr-12">
          <div className="flex items-start gap-3">
            <EventIcon type={event.type} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{auditEventTypeLabels[event.type]}</SheetTitle>
                <AuditStatusBadge status={event.status} />
              </div>
              <SheetDescription className="mt-1">
                {event.id} · {event.branch.name}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-5">
            <DetailSection title="Event">
              <DetailGrid>
                <DetailMeta label="Audit / Event ID" value={event.id} />
                <DetailMeta
                  label="Event Type"
                  value={auditEventTypeLabels[event.type]}
                />
                <DetailMeta label="Status" value={event.status} />
              </DetailGrid>
            </DetailSection>
            <div className="grid gap-4 sm:grid-cols-3">
              <IdentityCard
                icon={CircleUserRound}
                eyebrow="Who"
                title={event.actor}
                detail={event.actorRole}
              />
              <IdentityCard
                icon={CalendarClock}
                eyebrow="When"
                title={formatDateTime(event.timestamp)}
                detail="Recorded system timestamp"
              />
              <IdentityCard
                icon={ShieldCheck}
                eyebrow="Where"
                title={event.branch.name}
                detail={`${event.branch.code} · ${event.branch.region}`}
              />
            </div>
            <DetailSection title="Entity">
              <DetailGrid>
                <DetailMeta label="Entity Type" value={event.entityType} />
                <DetailMeta
                  label="Product"
                  value={
                    event.product
                      ? `${event.product.name} · ${event.product.sku}`
                      : "Not applicable"
                  }
                />
                <DetailMeta
                  label="Batch"
                  value={
                    event.batch
                      ? `${event.batch.lotNumber} · ${event.batch.id}`
                      : "Not linked"
                  }
                />
                <DetailMeta
                  label="Action"
                  value={event.action?.id ?? "Not linked"}
                />
              </DetailGrid>
            </DetailSection>
            <DetailSection title="Change / Result">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm leading-6 text-foreground/85">
                  {event.description}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ChangeValue
                    label="Previous Value"
                    value={event.previousValue}
                  />
                  <ChangeValue label="New Value" value={event.newValue} />
                  <ChangeValue
                    label="Quantity"
                    value={
                      event.quantity == null
                        ? undefined
                        : `${event.quantity} units`
                    }
                  />
                  <ChangeValue label="Outcome" value={event.outcome} />
                </div>
              </div>
            </DetailSection>
            {sourceEvent || linkedChanges.length ? (
              <DetailSection title="Source / Linked History">
                <div className="space-y-2">
                  {sourceEvent ? (
                    <LinkedEvent
                      event={sourceEvent}
                      onSelect={onSelectLinked}
                    />
                  ) : null}
                  {linkedChanges.map((linkedEvent) => (
                    <LinkedEvent
                      key={linkedEvent.id}
                      event={linkedEvent}
                      onSelect={onSelectLinked}
                    />
                  ))}
                </div>
              </DetailSection>
            ) : null}
            <DetailSection title="Notes">
              <div className="rounded-lg border p-4 text-sm leading-6 text-muted-foreground">
                {event.reason ? (
                  <p>
                    <span className="font-semibold text-foreground">
                      Reason:{" "}
                    </span>
                    {event.reason}
                  </p>
                ) : null}
                <p className={event.reason ? "mt-2" : ""}>
                  {event.note ?? "No additional operational note recorded."}
                </p>
              </div>
            </DetailSection>
            {event.product ? (
              <Button asChild variant="outline" className="w-full gap-2">
                <Link to={`/products/${event.product.id}`}>
                  <PackageCheck className="size-4" />
                  Open Product Intelligence
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        {canModify && (event.canCorrect || event.canReverse) ? (
          <SheetFooter className="border-t bg-background px-5 py-4">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {event.canReverse ? (
                <Button variant="outline" onClick={onReverse} className="gap-2">
                  {event.reversalMode === "cancellation" ? (
                    <Ban className="size-4" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}
                  {event.reversalMode === "cancellation" ? "Cancel" : "Reverse"}
                </Button>
              ) : null}
              {event.canCorrect ? (
                <Button onClick={onCorrect} className="gap-2">
                  <PencilLine className="size-4" />
                  Correct Record
                </Button>
              ) : null}
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ChangeDialog({
  mode,
  event,
  value,
  setValue,
  reason,
  setReason,
  note,
  setNote,
  onOpenChange,
  onSubmit,
}: {
  mode: ChangeMode;
  event: AuditEvent | null;
  value: string;
  setValue: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const isCorrection = mode === "correction";
  const isCancellation =
    mode === "reversal" && event?.reversalMode === "cancellation";
  const actionLabel = isCorrection
    ? "Record Correction"
    : isCancellation
    ? "Cancel Action"
    : "Record Reversal";
  return (
    <Dialog open={Boolean(mode && event)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            The original event remains visible. This creates a new linked{" "}
            {isCorrection
              ? "correction"
              : isCancellation
              ? "cancellation"
              : "reversal"}{" "}
            entry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/25 p-3">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Original Event
            </p>
            <p className="mt-1.5 text-xs font-semibold">
              {event ? `${auditEventTypeLabels[event.type]} · ${event.id}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {event?.newValue ?? event?.description}
            </p>
          </div>
          {isCorrection ? (
            <div>
              <Label htmlFor="corrected-value">
                Corrected {event?.correctableField ?? "value"}
              </Label>
              <Input
                id="corrected-value"
                value={value}
                onChange={(inputEvent) => setValue(inputEvent.target.value)}
                placeholder="Enter the corrected value or quantity"
                className="mt-2"
              />
            </div>
          ) : null}
          <div>
            <Label htmlFor="change-reason">Reason</Label>
            <Textarea
              id="change-reason"
              value={reason}
              onChange={(inputEvent) => setReason(inputEvent.target.value)}
              placeholder="Explain why this change is required…"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="change-note">Optional note</Label>
            <Textarea
              id="change-note"
              value={note}
              onChange={(inputEvent) => setNote(inputEvent.target.value)}
              placeholder="Add management or operational context…"
              className="mt-2"
            />
          </div>
          <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground">
            <History className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
            The new event will link back to the original record; no historical
            data is deleted or overwritten.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Original
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!reason.trim() || (isCorrection && !value.trim())}
            className="gap-2"
          >
            {isCorrection ? (
              <PencilLine className="size-4" />
            ) : (
              <Undo2 className="size-4" />
            )}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const eventIconConfig: Record<
  AuditEventType,
  { icon: LucideIcon; className: string }
> = {
  "action-created": {
    icon: ListChecks,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  "action-completed": {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  "expiry-removal": {
    icon: CalendarClock,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  "recount-completed": {
    icon: ArrowDownUp,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  "batch-created": { icon: Boxes, className: "bg-primary/8 text-primary" },
  "batch-information-updated": {
    icon: ClipboardCheck,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  "transfer-batch-information-entered": {
    icon: Boxes,
    className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  },
  "unassigned-decrement-resolved": {
    icon: ArrowDownUp,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  "fifo-verification": {
    icon: ShieldCheck,
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  "fifo-loss-recorded": {
    icon: AlertTriangle,
    className: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  "expiry-loss-recorded": {
    icon: AlertTriangle,
    className: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  "product-tracking-changed": {
    icon: PackageCheck,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  "remove-before-changed": {
    icon: SlidersHorizontal,
    className: "bg-primary/8 text-primary",
  },
  correction: {
    icon: PencilLine,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  cancellation: { icon: Ban, className: "bg-muted text-muted-foreground" },
  reversal: {
    icon: Undo2,
    className: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
};

function EventIcon({
  type,
  size = "default",
}: {
  type: AuditEventType;
  size?: "default" | "small";
}) {
  const config = eventIconConfig[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        size === "small" ? "size-8" : "size-10",
        config.className
      )}
    >
      <Icon className={size === "small" ? "size-3.5" : "size-[1.1rem]"} />
    </span>
  );
}

function AuditStatusBadge({ status }: { status: AuditEventStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md text-[0.64rem] capitalize",
        status === "corrected"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : status === "reversed" || status === "cancelled"
          ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
          : status === "completed"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : status === "open"
          ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400"
          : "bg-muted/60 text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}

function AuditMetric({
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

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full sm:w-44", className)}>
        <SelectValue placeholder={placeholder} />
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </p>
      {children}
    </section>
  );
}

function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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

function IdentityCard({
  icon: Icon,
  eyebrow,
  title,
  detail,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {eyebrow}
      </p>
      <p className="mt-1 text-xs font-semibold">{title}</p>
      <p className="mt-1 text-[0.65rem] leading-5 text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

function ChangeValue({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-xs font-semibold leading-5">
        {value ?? "Not recorded"}
      </p>
    </div>
  );
}

function LinkedEvent({
  event,
  onSelect,
}: {
  event: AuditEvent;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40"
    >
      <EventIcon type={event.type} size="small" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">
          {auditEventTypeLabels[event.type]}
        </p>
        <p className="mt-1 truncate text-[0.65rem] text-muted-foreground">
          {event.id} · {formatDateTime(event.timestamp)}
        </p>
      </div>
      <AuditStatusBadge status={event.status} />
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
      <Settings2 className="size-6 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Try a different branch, period, or filter.
      </p>
    </div>
  );
}

function withinPeriod(timestamp: string, period: string) {
  if (period === "all") return true;
  if (period === "today") return timestamp.slice(0, 10) === DEMO_TODAY;
  const cutoff = shiftDate(DEMO_TODAY, -Number(period));
  return timestamp.slice(0, 10) >= cutoff;
}

function shiftDate(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
