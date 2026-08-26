import { actionCenterItems, type ActionCenterItem } from "./action-center";
import {
  DEMO_TODAY,
  batches,
  branches,
  categories,
  lossEvents,
  products,
  suppliers,
  type Batch,
  type Branch,
  type LossEvent,
  type Product,
  type Supplier,
} from "./nems-data";

export type BatchOperationalStatus =
  | "open"
  | "remove-soon"
  | "remove-today"
  | "overdue"
  | "depleted"
  | "removed-resolved";

export type RemovalWindow =
  | "overdue"
  | "today"
  | "next3"
  | "next7"
  | "later"
  | "historical";

export type BatchRisk = "critical" | "high" | "medium" | "healthy";
export type FifoLabel = "consume-first" | "next" | "later" | "closed";

export type BatchTimelineItem = {
  id: string;
  occurredAt: string;
  type:
    | "received"
    | "information"
    | "snapshot"
    | "decrement"
    | "recount"
    | "removal"
    | "fifo"
    | "expiry"
    | "depletion"
    | "correction";
  title: string;
  description: string;
};

export type BatchIntelligenceRow = {
  batch: Batch;
  product: Product;
  branch: Branch;
  supplier: Supplier;
  categoryName: string;
  status: BatchOperationalStatus;
  removalWindow: RemovalWindow;
  daysToRemoval: number;
  salesVelocity: number;
  fifoPosition: number | null;
  fifoLabel: FifoLabel;
  risk: BatchRisk;
  source: "Supplier receiving" | "Inter-branch transfer";
  quantityDepleted: number;
  calculatedRemovalDate: string;
  relatedActions: ActionCenterItem[];
  relatedLossEvents: LossEvent[];
  confirmedFifoEvents: number;
  timeline: BatchTimelineItem[];
};

const DAY_MS = 86_400_000;

function daysBetween(date: string, comparison = DEMO_TODAY) {
  return Math.round(
    (new Date(`${date}T12:00:00Z`).getTime() -
      new Date(`${comparison}T12:00:00Z`).getTime()) /
      DAY_MS
  );
}

function shiftDate(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function getStatus(batch: Batch): BatchOperationalStatus {
  if (batch.status === "removed") {
    return batch.removedAt && batch.removedAt <= batch.removalDate
      ? "removed-resolved"
      : "depleted";
  }

  const daysToRemoval = daysBetween(batch.removalDate);
  if (daysToRemoval < 0) return "overdue";
  if (daysToRemoval === 0) return "remove-today";
  if (daysToRemoval <= 7) return "remove-soon";
  return "open";
}

function getRemovalWindow(batch: Batch): RemovalWindow {
  if (batch.status === "removed") return "historical";
  const daysToRemoval = daysBetween(batch.removalDate);
  if (daysToRemoval < 0) return "overdue";
  if (daysToRemoval === 0) return "today";
  if (daysToRemoval <= 3) return "next3";
  if (daysToRemoval <= 7) return "next7";
  return "later";
}

function getTimeline(
  batch: Batch,
  supplier: Supplier,
  relatedActions: ActionCenterItem[],
  relatedLossEvents: LossEvent[]
) {
  const quantityDepleted = Math.max(0, batch.initialUnits - batch.unitsOnHand);
  const items: BatchTimelineItem[] = [
    {
      id: `${batch.id}-received`,
      occurredAt: batch.receivedDate,
      type: "received",
      title: "Batch received",
      description: `${batch.initialUnits} units entered tracked inventory from ${supplier.name}.`,
    },
    {
      id: `${batch.id}-information`,
      occurredAt: shiftDate(batch.receivedDate, 1),
      type: "information",
      title: "Batch information entered",
      description: `Expiry ${batch.expiryDate}; calculated removal ${batch.removalDate}.`,
    },
  ];

  if (batch.status === "active") {
    items.push({
      id: `${batch.id}-snapshot`,
      occurredAt: DEMO_TODAY,
      type: "snapshot",
      title: "Current stock snapshot",
      description: `${batch.unitsOnHand} units remain available in this batch.`,
    });
    if (quantityDepleted > 0) {
      items.push({
        id: `${batch.id}-decrement`,
        occurredAt: shiftDate(DEMO_TODAY, -3),
        type: "decrement",
        title: "System quantity movement",
        description: `${quantityDepleted} units have been depleted through normal FIFO allocation since receipt.`,
      });
    }
  }

  if (batch.status === "removed" && batch.removedAt) {
    items.push({
      id: `${batch.id}-depleted`,
      occurredAt: batch.removedAt,
      type: "depletion",
      title: "Batch closed",
      description:
        batch.removedAt <= batch.removalDate
          ? "The batch was depleted or removed within its planned window."
          : "The batch closed after its planned removal date.",
    });
  }

  relatedActions.forEach((action) => {
    items.push({
      id: `${batch.id}-${action.id}`,
      occurredAt: action.completedAt ?? action.createdAt,
      type:
        action.type === "fifo-verification"
          ? "fifo"
          : action.type === "recount"
          ? "recount"
          : action.type === "expiry-removal"
          ? "removal"
          : "correction",
      title:
        action.status === "completed"
          ? `${action.typeLabel} completed`
          : `${action.typeLabel} created`,
      description: action.reason,
    });
  });

  relatedLossEvents.slice(0, 5).forEach((event) => {
    items.push({
      id: `${batch.id}-${event.id}`,
      occurredAt: event.occurredAt,
      type: event.type === "fifo" ? "fifo" : "expiry",
      title:
        event.type === "fifo"
          ? "Related physical FIFO event"
          : event.type === "expiry"
          ? "Related expiry event"
          : "Related early-removal event",
      description: `${event.units} units · $${event.value.toFixed(
        2
      )} in product/branch history.`,
    });
  });

  return items
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 20);
}

export function getBatchIntelligence(
  selectedBranchId: string = "all"
): BatchIntelligenceRow[] {
  const scopedBranchIds =
    selectedBranchId === "all"
      ? branches.map((branch) => branch.id)
      : branches.some((branch) => branch.id === selectedBranchId)
      ? [selectedBranchId]
      : branches.map((branch) => branch.id);

  return batches
    .filter((batch) => scopedBranchIds.includes(batch.branchId))
    .map((batch) => {
      const product = products.find((item) => item.id === batch.productId)!;
      const branch = branches.find((item) => item.id === batch.branchId)!;
      const supplier = suppliers.find(
        (item) => item.id === product.supplierId
      )!;
      const activeSiblingBatches = batches
        .filter(
          (item) =>
            item.productId === product.id &&
            item.branchId === branch.id &&
            item.status === "active"
        )
        .sort(
          (a, b) =>
            a.receivedDate.localeCompare(b.receivedDate) ||
            a.expiryDate.localeCompare(b.expiryDate)
        );
      const fifoIndex = activeSiblingBatches.findIndex(
        (item) => item.id === batch.id
      );
      const fifoPosition = fifoIndex >= 0 ? fifoIndex + 1 : null;
      const relatedActions = actionCenterItems.filter(
        (action) => action.batch?.id === batch.id
      );
      const productBranchLossEvents = lossEvents.filter(
        (event) =>
          event.productId === product.id && event.branchId === branch.id
      );
      const confirmedFifoEvents = productBranchLossEvents.filter(
        (event) => event.type === "fifo"
      ).length;
      const status = getStatus(batch);
      const daysToRemoval = daysBetween(batch.removalDate);
      const calculatedRemovalDate = shiftDate(
        batch.expiryDate,
        -(product.removeBeforeDays ?? 0)
      );
      const hasOpenAction = relatedActions.some(
        (action) => action.status !== "completed"
      );
      const risk: BatchRisk =
        status === "overdue"
          ? "critical"
          : status === "remove-today" ||
            (status === "remove-soon" && confirmedFifoEvents > 0)
          ? "high"
          : status === "remove-soon" || confirmedFifoEvents > 0 || hasOpenAction
          ? "medium"
          : "healthy";
      const source: BatchIntelligenceRow["source"] = relatedActions.some(
        (action) => action.type === "transfer-arrival"
      )
        ? "Inter-branch transfer"
        : "Supplier receiving";

      return {
        batch,
        product,
        branch,
        supplier,
        categoryName:
          categories.find((category) => category.id === product.categoryId)
            ?.name ?? "Uncategorized",
        status,
        removalWindow: getRemovalWindow(batch),
        daysToRemoval,
        salesVelocity: product.salesVelocity[branch.id] ?? 0,
        fifoPosition,
        fifoLabel:
          fifoPosition === 1
            ? "consume-first"
            : fifoPosition === 2
            ? "next"
            : fifoPosition
            ? "later"
            : "closed",
        risk,
        source,
        quantityDepleted: Math.max(0, batch.initialUnits - batch.unitsOnHand),
        calculatedRemovalDate,
        relatedActions,
        relatedLossEvents: productBranchLossEvents,
        confirmedFifoEvents,
        timeline: getTimeline(
          batch,
          supplier,
          relatedActions,
          productBranchLossEvents
        ),
      } satisfies BatchIntelligenceRow;
    })
    .filter((row) => row.product.trackedBranchIds.includes(row.branch.id))
    .sort((a, b) => {
      if (a.batch.status !== b.batch.status)
        return a.batch.status === "active" ? -1 : 1;
      return a.batch.removalDate.localeCompare(b.batch.removalDate);
    });
}
