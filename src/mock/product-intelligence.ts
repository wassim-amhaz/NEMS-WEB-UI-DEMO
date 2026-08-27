import {
  DEMO_TODAY,
  batches,
  branches,
  categories,
  earlyRemovalLossEvents,
  expiryLossEvents,
  fifoLossEvents,
  getProduct,
  operationalActions,
  suppliers,
  type Batch,
  type Branch,
  type LossEvent,
  type OperationalAction,
  type Product,
} from "./nems-data";
import { actionCenterItems } from "./action-center";

export type ProductBatchStatus =
  | "open"
  | "remove-soon"
  | "remove-today"
  | "overdue"
  | "depleted";

export type ProductRisk = "critical" | "high" | "medium" | "healthy";

export type ProductBatchRow = {
  batch: Batch;
  branch: Branch;
  status: ProductBatchStatus;
  daysToRemoval: number;
  fifoPosition: number | null;
  consumeFirst: boolean;
};

export type FifoSignal = {
  id: string;
  occurredAt: string;
  branch: Branch;
  state: "confirmed" | "suspected";
  units: number | null;
  value: number | null;
  description: string;
};

export type ProductHistoryItem = {
  id: string;
  occurredAt: string;
  branch: Branch;
  type:
    | "received"
    | "expiry-entered"
    | "stock-change"
    | "removal"
    | "fifo"
    | "expiry"
    | "depletion"
    | "action";
  title: string;
  description: string;
};

export type ProductIntelligence = {
  product: Product;
  categoryName: string;
  supplierName: string;
  contextLabel: string;
  contextBranchIds: string[];
  isTrackedInContext: boolean;
  isAvailableInContext: boolean;
  metrics: {
    currentStock: number;
    averageDailyVelocity: number;
    activeBatches: number;
    expiryExposure: number;
    expiryExposureUnits: number;
    fifoLoss: number;
    fifoUnits: number;
    fifoLossRate: number;
    expiryLoss: number;
    expiryUnits: number;
    earlyRemovalLoss: number;
    earlyRemovalUnits: number;
    avoidableLoss: number;
    openActions: number;
    risk: ProductRisk;
  };
  nextRemovalDate: string | null;
  batchRows: ProductBatchRow[];
  fifoSignals: FifoSignal[];
  fifoEvents: LossEvent[];
  expiryEvents: LossEvent[];
  earlyRemovalEvents: LossEvent[];
  actions: Array<
    OperationalAction & {
      branch: Branch;
      displayStatus: string;
      createdAt: string;
      dueAt: string;
    }
  >;
  history: ProductHistoryItem[];
  recurringExpiryLoss: boolean;
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

function sum(events: LossEvent[], field: "units" | "value") {
  return events.reduce((total, event) => total + event[field], 0);
}

function getBatchStatus(batch: Batch): ProductBatchStatus {
  if (batch.status === "removed" || batch.unitsOnHand === 0) return "depleted";
  const daysToRemoval = daysBetween(batch.removalDate);
  if (daysToRemoval < 0) return "overdue";
  if (daysToRemoval === 0) return "remove-today";
  if (daysToRemoval <= 7) return "remove-soon";
  return "open";
}

function getDisplayActionStatus(action: OperationalAction) {
  if (action.status === "completed") return "Completed";
  if (action.dueDate < DEMO_TODAY) return "Overdue";
  if (action.status === "in-progress") return "In progress";
  return "Open";
}

function getHistory(
  product: Product,
  productBatches: Batch[],
  fifoEvents: LossEvent[],
  expiryEvents: LossEvent[],
  earlyRemovalEvents: LossEvent[],
  actions: ProductIntelligence["actions"]
) {
  const items: ProductHistoryItem[] = [];

  productBatches.forEach((batch) => {
    const branch = branches.find((item) => item.id === batch.branchId)!;
    items.push({
      id: `${batch.id}-received`,
      occurredAt: batch.receivedDate,
      branch,
      type: "received",
      title: `Batch ${batch.lotNumber} received`,
      description: `${batch.initialUnits} units added to ${branch.name}.`,
    });
    items.push({
      id: `${batch.id}-expiry`,
      occurredAt: shiftDate(batch.receivedDate, 1),
      branch,
      type: "expiry-entered",
      title: "Expiry and removal dates recorded",
      description: `Expiry ${batch.expiryDate}; remove ${
        product.removeBeforeDays ?? 0
      } days earlier on ${batch.removalDate}.`,
    });

    if (batch.status === "active") {
      items.push({
        id: `${batch.id}-stock`,
        occurredAt: shiftDate(DEMO_TODAY, -2 - (batch.id.length % 3)),
        branch,
        type: "stock-change",
        title: "Stock position updated",
        description: `${batch.unitsOnHand} units remain from ${batch.initialUnits} received.`,
      });
    }

    if (batch.status === "removed" && batch.removedAt) {
      items.push({
        id: `${batch.id}-removed`,
        occurredAt: batch.removedAt,
        branch,
        type: "depletion",
        title: "Batch depleted and closed",
        description: `Batch ${batch.lotNumber} left active inventory.`,
      });
    }
  });

  fifoEvents.forEach((event) => {
    const branch = branches.find((item) => item.id === event.branchId)!;
    items.push({
      id: `${event.id}-history`,
      occurredAt: event.occurredAt,
      branch,
      type: "fifo",
      title: "Confirmed FIFO loss",
      description: `${event.units} units valued at $${event.value.toFixed(
        2
      )} confirmed outside FIFO sequence.`,
    });
  });

  expiryEvents.forEach((event) => {
    const branch = branches.find((item) => item.id === event.branchId)!;
    items.push({
      id: `${event.id}-history`,
      occurredAt: event.occurredAt,
      branch,
      type: "expiry",
      title: "Expiry loss confirmed",
      description: `${
        event.units
      } expired units recorded at $${event.value.toFixed(2)}.`,
    });
  });

  earlyRemovalEvents.forEach((event) => {
    const branch = branches.find((item) => item.id === event.branchId)!;
    items.push({
      id: `${event.id}-history`,
      occurredAt: event.occurredAt,
      branch,
      type: "removal",
      title: "Early-removal loss recorded",
      description: `${event.units} usable units removed before the planned date.`,
    });
  });

  actions.forEach((action) => {
    const branch = branches.find((item) => item.id === action.branchId)!;
    items.push({
      id: `${action.id}-history`,
      occurredAt: action.completedAt ?? action.createdAt,
      branch,
      type: "action",
      title:
        action.status === "completed"
          ? "Operational action resolved"
          : "Operational action created",
      description: action.title,
    });
  });

  return items
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 36);
}

export function getProductIntelligence(
  productId: string,
  selectedBranchId: string
): ProductIntelligence | undefined {
  const product = getProduct(productId);
  if (!product) return undefined;

  const isAllBranches = selectedBranchId === "all";
  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchId
  );
  const contextBranchIds = isAllBranches
    ? product.trackedBranchIds
    : selectedBranch
    ? [selectedBranch.id]
    : product.trackedBranchIds;
  const contextLabel = isAllBranches
    ? "All Branches"
    : selectedBranch?.name ?? "All Branches";
  const isTrackedInContext = isAllBranches
    ? product.nemsTracked && product.trackedBranchIds.length > 0
    : Boolean(
        selectedBranch && product.trackedBranchIds.includes(selectedBranch.id)
      );
  const isAvailableInContext = isAllBranches
    ? product.availableBranchIds.length > 0
    : Boolean(
        selectedBranch && product.availableBranchIds.includes(selectedBranch.id)
      );
  const intelligenceBranchIds = isTrackedInContext ? contextBranchIds : [];
  const productBatches = batches.filter(
    (batch) =>
      batch.productId === product.id &&
      intelligenceBranchIds.includes(batch.branchId)
  );
  const activeBatches = productBatches.filter(
    (batch) => batch.status === "active"
  );
  const fifoEvents = fifoLossEvents.filter(
    (event) =>
      event.productId === product.id &&
      intelligenceBranchIds.includes(event.branchId)
  );
  const expiryEvents = expiryLossEvents.filter(
    (event) =>
      event.productId === product.id &&
      intelligenceBranchIds.includes(event.branchId)
  );
  const earlyRemovalEvents = earlyRemovalLossEvents.filter(
    (event) =>
      event.productId === product.id &&
      intelligenceBranchIds.includes(event.branchId)
  );
  const productActions = operationalActions.filter(
    (action) =>
      action.productId === product.id &&
      intelligenceBranchIds.includes(action.branchId)
  );
  const intelligenceActions: ProductIntelligence["actions"] = productActions
    .map((action) => {
      const canonicalAction = actionCenterItems.find(
        (item) => item.id === action.id
      );
      return {
        ...action,
        completedAt: canonicalAction?.completedAt ?? action.completedAt,
        branch: branches.find((branch) => branch.id === action.branchId)!,
        displayStatus: getDisplayActionStatus(action),
        createdAt:
          canonicalAction?.createdAt ?? `${action.dueDate}T08:00:00`,
        dueAt: canonicalAction?.dueAt ?? `${action.dueDate}T17:00:00`,
      };
    })
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return b.dueAt.localeCompare(a.dueAt);
    });

  const batchRows = productBatches
    .map((batch) => {
      const branch = branches.find((item) => item.id === batch.branchId)!;
      const activeBranchBatches = activeBatches
        .filter((item) => item.branchId === batch.branchId)
        .sort(
          (a, b) =>
            a.expiryDate.localeCompare(b.expiryDate) ||
            a.receivedDate.localeCompare(b.receivedDate)
        );
      const fifoIndex = activeBranchBatches.findIndex(
        (item) => item.id === batch.id
      );
      return {
        batch,
        branch,
        status: getBatchStatus(batch),
        daysToRemoval: daysBetween(batch.removalDate),
        fifoPosition: fifoIndex >= 0 ? fifoIndex + 1 : null,
        consumeFirst: fifoIndex === 0,
      } satisfies ProductBatchRow;
    })
    .sort((a, b) => {
      if (a.batch.status !== b.batch.status)
        return a.batch.status === "active" ? -1 : 1;
      return a.batch.removalDate.localeCompare(b.batch.removalDate);
    });

  const confirmedSignals: FifoSignal[] = fifoEvents.map((event) => ({
    id: event.id,
    occurredAt: event.occurredAt,
    branch: branches.find((item) => item.id === event.branchId)!,
    state: "confirmed",
    units: event.units,
    value: event.value,
    description:
      "A physical audit confirmed that shelf or storage stock was not rotated in the expected FIFO sequence.",
  }));
  const suspectedSignals: FifoSignal[] = batchRows
    .filter(
      (row) =>
        row.batch.status === "active" &&
        row.batch.unitsOnHand <= 5 &&
        fifoEvents.some((event) => event.branchId === row.batch.branchId)
    )
    .slice(0, isAllBranches ? 3 : 1)
    .map((row) => ({
      id: `${row.batch.id}-suspected-fifo`,
      occurredAt: DEMO_TODAY,
      branch: row.branch,
      state: "suspected",
      units: null,
      value: null,
      description:
        "The expected FIFO batch is at its final units and this product has confirmed physical FIFO history. Verify the remaining shelf or storage units before depletion.",
    }));
  const fifoSignals = [...suspectedSignals, ...confirmedSignals].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt)
  );

  const expiryExposureBatches = activeBatches.filter((batch) => {
    const daysToExpiry = daysBetween(batch.expiryDate);
    return daysToExpiry >= -4 && daysToExpiry <= 14;
  });
  const currentStock = sumBatchUnits(activeBatches);
  const averageDailyVelocity =
    intelligenceBranchIds.reduce(
      (total, branchId) => total + (product.salesVelocity[branchId] ?? 0),
      0
    ) / Math.max(intelligenceBranchIds.length, 1);
  const fifoLoss = sum(fifoEvents, "value");
  const fifoUnits = sum(fifoEvents, "units");
  const expiryLoss = sum(expiryEvents, "value");
  const expiryUnits = sum(expiryEvents, "units");
  const earlyRemovalLoss = sum(earlyRemovalEvents, "value");
  const earlyRemovalUnits = sum(earlyRemovalEvents, "units");
  const expiryExposure = expiryExposureBatches.reduce(
    (total, batch) => total + batch.unitsOnHand * batch.unitCost,
    0
  );
  const expiryExposureUnits = sumBatchUnits(expiryExposureBatches);
  const preventableExpiry = expiryEvents.reduce(
    (total, event) => total + event.value * event.preventablePercent,
    0
  );
  const avoidableLoss =
    fifoLoss +
    earlyRemovalEvents.reduce(
      (total, event) => total + event.value * event.preventablePercent,
      0
    ) +
    preventableExpiry;
  const openActions = productActions.filter(
    (action) => action.status !== "completed"
  );
  const hasOverdueBatch = batchRows.some((row) => row.status === "overdue");
  const hasOverdueAction = openActions.some(
    (action) => action.dueDate < DEMO_TODAY
  );
  const risk: ProductRisk =
    hasOverdueBatch || hasOverdueAction
      ? "critical"
      : expiryExposure >= 200 || fifoLoss + expiryLoss >= 200
      ? "high"
      : expiryExposure > 0 ||
        fifoEvents.length > 0 ||
        expiryEvents.length > 0 ||
        openActions.length > 0
      ? "medium"
      : "healthy";
  const expiryBranches = new Set(expiryEvents.map((event) => event.branchId));

  return {
    product,
    categoryName:
      categories.find((category) => category.id === product.categoryId)?.name ??
      "Uncategorized",
    supplierName:
      suppliers.find((supplier) => supplier.id === product.supplierId)?.name ??
      "Unknown supplier",
    contextLabel,
    contextBranchIds,
    isTrackedInContext,
    isAvailableInContext,
    metrics: {
      currentStock,
      averageDailyVelocity: Number(averageDailyVelocity.toFixed(1)),
      activeBatches: activeBatches.length,
      expiryExposure: Number(expiryExposure.toFixed(2)),
      expiryExposureUnits,
      fifoLoss: Number(fifoLoss.toFixed(2)),
      fifoUnits,
      fifoLossRate:
        (fifoUnits /
          Math.max(
            averageDailyVelocity * intelligenceBranchIds.length * 30 +
              fifoUnits,
            1
          )) *
        100,
      expiryLoss: Number(expiryLoss.toFixed(2)),
      expiryUnits,
      earlyRemovalLoss: Number(earlyRemovalLoss.toFixed(2)),
      earlyRemovalUnits,
      avoidableLoss: Number(avoidableLoss.toFixed(2)),
      openActions: openActions.length,
      risk,
    },
    nextRemovalDate:
      activeBatches
        .map((batch) => batch.removalDate)
        .sort((a, b) => a.localeCompare(b))[0] ?? null,
    batchRows,
    fifoSignals,
    fifoEvents,
    expiryEvents,
    earlyRemovalEvents,
    actions: intelligenceActions,
    history: getHistory(
      product,
      productBatches,
      fifoEvents,
      expiryEvents,
      earlyRemovalEvents,
      intelligenceActions
    ),
    recurringExpiryLoss: expiryEvents.length >= 4 || expiryBranches.size >= 2,
  };
}

function sumBatchUnits(productBatches: Batch[]) {
  return productBatches.reduce((total, batch) => total + batch.unitsOnHand, 0);
}
