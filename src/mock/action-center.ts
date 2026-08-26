import {
  DEMO_TODAY,
  batches,
  branches,
  categories,
  fifoLossEvents,
  operationalActions,
  products,
  type Batch,
  type Branch,
  type OperationalAction,
  type Product,
} from "./nems-data";

export type ActionCenterType =
  | "expiry-removal"
  | "missing-batch-information"
  | "recount"
  | "unassigned-decrement"
  | "transfer-arrival"
  | "fifo-verification"
  | "urgent-operational-check";

export type ActionTiming = "overdue" | "due-today" | "upcoming" | "completed";

export type ActionEvidence = {
  label: string;
  value: string;
};

export type ActionCenterItem = {
  id: string;
  type: ActionCenterType;
  typeLabel: string;
  priority: OperationalAction["priority"];
  status: OperationalAction["status"];
  timing: ActionTiming;
  product: Product;
  branch: Branch;
  categoryName: string;
  batch?: Batch;
  candidateBatches: Batch[];
  quantity: number | null;
  expectedStock: number;
  decrementQuantity: number | null;
  createdAt: string;
  dueAt: string;
  completedAt?: string;
  assignedTo: string;
  reason: string;
  why: string;
  evidence: ActionEvidence[];
  recommendedAction: string;
  previousFifoViolations: number;
  fifoRisk: "Low" | "Moderate" | "High";
};

export const actionTypeLabels: Record<ActionCenterType, string> = {
  "expiry-removal": "Expiry Removal",
  "missing-batch-information": "Missing Batch Information",
  recount: "Recount",
  "unassigned-decrement": "Unassigned Decrement",
  "transfer-arrival": "Transfer Arrival",
  "fifo-verification": "FIFO Verification",
  "urgent-operational-check": "Urgent Operational Check",
};

const DAY_MS = 86_400_000;

function shiftDate(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function getSequence(action: OperationalAction) {
  return Number(action.id.split("-").at(-1)) || 1;
}

function getProductBatch(action: OperationalAction) {
  return (
    batches.find((batch) => batch.id === action.batchId) ??
    batches
      .filter(
        (batch) =>
          batch.productId === action.productId &&
          batch.branchId === action.branchId &&
          batch.status === "active"
      )
      .sort((a, b) => a.removalDate.localeCompare(b.removalDate))[0]
  );
}

function hasFifoVerificationTrigger(
  action: OperationalAction,
  batch: Batch | undefined
) {
  if (!batch || batch.status !== "active" || batch.unitsOnHand > 5)
    return false;
  return fifoLossEvents.some(
    (event) =>
      event.productId === action.productId && event.branchId === action.branchId
  );
}

function getActionType(
  action: OperationalAction,
  batch: Batch | undefined
): ActionCenterType {
  if (hasFifoVerificationTrigger(action, batch)) return "fifo-verification";

  const sequence = getSequence(action);
  if (action.status === "completed") {
    const completedTypes: ActionCenterType[] = [
      "expiry-removal",
      "recount",
      "missing-batch-information",
      "transfer-arrival",
      "unassigned-decrement",
      "urgent-operational-check",
    ];
    return completedTypes[
      (sequence + Number(action.branchId.length)) % completedTypes.length
    ];
  }

  if (action.type === "remove") return "expiry-removal";
  if (action.type === "transfer") return "transfer-arrival";
  if (action.type === "review") {
    return sequence % 3 === 0 ? "missing-batch-information" : "recount";
  }
  return sequence % 2 === 0
    ? "urgent-operational-check"
    : "unassigned-decrement";
}

function getTiming(action: OperationalAction): ActionTiming {
  if (action.status === "completed") return "completed";
  if (action.dueDate < DEMO_TODAY) return "overdue";
  if (action.dueDate === DEMO_TODAY) return "due-today";
  return "upcoming";
}

function getAssignee(branch: Branch, sequence: number) {
  const teams: Record<string, string[]> = {
    "br-downtown": ["Rana Mansour", "Elias Khoury", "Mira Saad"],
    "br-north": ["Karim Haddad", "Nadine Azar", "Fadi Karam"],
    "br-airport": ["Maya Khoury", "Samer Farah", "Lina Daher"],
    "br-hamra": ["Omar Nasser", "Tala Aoun", "Joe Saliba"],
  };
  const team = teams[branch.id] ?? [branch.manager];
  return team[(sequence - 1) % team.length];
}

function getCurrentStock(productId: string, branchId: string) {
  return batches
    .filter(
      (batch) =>
        batch.productId === productId &&
        batch.branchId === branchId &&
        batch.status === "active"
    )
    .reduce((total, batch) => total + batch.unitsOnHand, 0);
}

function getReason(
  type: ActionCenterType,
  batch: Batch | undefined,
  product: Product,
  fifoViolations: number,
  decrementQuantity: number
) {
  switch (type) {
    case "expiry-removal":
      return `${
        batch?.unitsOnHand ?? 0
      } units reached their Remove Before window.`;
    case "missing-batch-information":
      return "Receiving data requires quantity and expiry-label confirmation.";
    case "recount":
      return "System stock and recent movement require a physical recount.";
    case "unassigned-decrement":
      return `${decrementQuantity} decremented units are not yet linked to a batch.`;
    case "transfer-arrival":
      return `Incoming ${product.name} requires receiving and expiry confirmation.`;
    case "fifo-verification":
      return `The expected FIFO batch has ${
        batch?.unitsOnHand ?? 0
      } units remaining and ${fifoViolations} previous confirmed physical FIFO violations.`;
    case "urgent-operational-check":
      return "An overdue or high-priority stock exception needs a supervisor check.";
  }
}

function getWhy(
  type: ActionCenterType,
  fifoViolations: number
) {
  switch (type) {
    case "expiry-removal":
      return "The active batch has entered or passed its configured Remove Before window and must be removed from sellable stock.";
    case "missing-batch-information":
      return "NEMS cannot calculate reliable expiry and removal attention until the received quantity and physical expiry label are confirmed.";
    case "recount":
      return "Recent movement left a stock variance signal. A physical count is required before NEMS can trust the current batch balance.";
    case "unassigned-decrement":
      return "A stock decrement was recorded without a batch reference. It must be assigned so batch balances remain auditable.";
    case "transfer-arrival":
      return "A tracked product is arriving from another location. Receiving details are needed before the incoming stock can enter NEMS monitoring.";
    case "fifo-verification":
      return `The current expected FIFO batch is approaching depletion and this product has ${fifoViolations} previous confirmed physical FIFO violations.`;
    case "urgent-operational-check":
      return "NEMS detected a time-sensitive inventory condition that requires a direct operational review rather than an automatic assumption.";
  }
}

function getRecommendedAction(
  type: ActionCenterType,
  batch: Batch | undefined
) {
  switch (type) {
    case "expiry-removal":
      return "Remove the expected quantity from shelf and storage, enter the confirmed quantity, and record any variance.";
    case "missing-batch-information":
      return "Inspect the supplier label, enter the received quantity and expiry date, then save the batch information.";
    case "recount":
      return "Count all sellable units for this product and record the physical total. Add a note if the count differs from NEMS.";
    case "unassigned-decrement":
      return "Review the eligible batch and assign the decrement to the correct batch. Escalate if no batch can be verified.";
    case "transfer-arrival":
      return "Confirm the received quantity and expiry label. Review the calculated removal date before completing receipt.";
    case "fifo-verification":
      return `Physically verify that the remaining product on shelf or in storage belongs to ${
        batch?.lotNumber ?? "the expected FIFO batch"
      } and confirm that FIFO sequence is being followed before the batch is considered depleted.`;
    case "urgent-operational-check":
      return "Inspect the product and batch record, document the observed condition, and complete or escalate the check.";
  }
}

function getEvidence(
  type: ActionCenterType,
  batch: Batch | undefined,
  product: Product,
  expectedStock: number,
  decrementQuantity: number,
  fifoViolations: number,
  fifoRisk: ActionCenterItem["fifoRisk"]
): ActionEvidence[] {
  const batchLabel = batch?.lotNumber ?? "Pending batch";
  switch (type) {
    case "expiry-removal":
      return [
        { label: "Batch", value: batchLabel },
        {
          label: "Expected removal",
          value: `${batch?.unitsOnHand ?? 0} units`,
        },
        { label: "Removal date", value: batch?.removalDate ?? "Not recorded" },
        { label: "Expiry date", value: batch?.expiryDate ?? "Not recorded" },
      ];
    case "missing-batch-information":
      return [
        {
          label: "Receiving reference",
          value: batch?.id ?? "Unlinked receipt",
        },
        { label: "Product", value: product.sku },
        { label: "Quantity confirmation", value: "Required" },
        { label: "Expiry-label verification", value: "Required" },
      ];
    case "recount":
      return [
        { label: "Expected stock", value: `${expectedStock} units` },
        { label: "Active batch", value: batchLabel },
        {
          label: "Last system balance",
          value: `${batch?.unitsOnHand ?? expectedStock} units`,
        },
      ];
    case "unassigned-decrement":
      return [
        { label: "Unassigned decrement", value: `${decrementQuantity} units` },
        { label: "Candidate batch", value: batchLabel },
        { label: "Expected stock", value: `${expectedStock} units` },
      ];
    case "transfer-arrival":
      return [
        { label: "Incoming product", value: product.sku },
        {
          label: "Expected quantity",
          value: `${batch?.initialUnits ?? expectedStock} units`,
        },
        {
          label: "Remove Before",
          value: `${product.removeBeforeDays ?? 3} days`,
        },
        { label: "Receiving reference", value: batch?.id ?? "Pending receipt" },
      ];
    case "fifo-verification":
      return [
        { label: "Expected current FIFO batch", value: batchLabel },
        {
          label: "Quantity remaining",
          value: `${batch?.unitsOnHand ?? 0} units`,
        },
        {
          label: "Previous confirmed FIFO violations",
          value: String(fifoViolations),
        },
        { label: "Current FIFO risk", value: fifoRisk },
        { label: "Removal date", value: batch?.removalDate ?? "Not recorded" },
      ];
    case "urgent-operational-check":
      return [
        { label: "Product", value: product.sku },
        { label: "Batch", value: batchLabel },
        {
          label: "Units exposed",
          value: `${batch?.unitsOnHand ?? expectedStock} units`,
        },
        { label: "Removal date", value: batch?.removalDate ?? "Not recorded" },
      ];
  }
}

function buildAction(action: OperationalAction): ActionCenterItem | null {
  const product = products.find((item) => item.id === action.productId);
  const branch = branches.find((item) => item.id === action.branchId);
  if (!product || !branch || !product.trackedBranchIds.includes(branch.id)) {
    return null;
  }

  const sequence = getSequence(action);
  const batch = getProductBatch(action);
  const type = getActionType(action, batch);
  const fifoEvents = fifoLossEvents.filter(
    (event) => event.productId === product.id && event.branchId === branch.id
  );
  const fifoViolations = fifoEvents.length;
  const expectedStock = getCurrentStock(product.id, branch.id);
  const decrementQuantity = 3 + ((sequence + branch.code.length) % 8);
  const candidateBatches = batches.filter(
    (item) =>
      item.productId === product.id &&
      item.branchId === branch.id &&
      item.status === "active"
  );
  const fifoRisk: ActionCenterItem["fifoRisk"] =
    fifoViolations >= 3 ? "High" : fifoViolations > 0 ? "Moderate" : "Low";
  const dueHour = 9 + (sequence % 7);
  const createdDate = shiftDate(action.dueDate, -2 - (sequence % 4));

  return {
    id: action.id,
    type,
    typeLabel: actionTypeLabels[type],
    priority: action.priority,
    status: action.status,
    timing: getTiming(action),
    product,
    branch,
    categoryName:
      categories.find((category) => category.id === product.categoryId)?.name ??
      "Uncategorized",
    batch,
    candidateBatches,
    quantity:
      type === "expiry-removal"
        ? batch?.unitsOnHand ?? 0
        : type === "transfer-arrival"
        ? batch?.initialUnits ?? expectedStock
        : type === "fifo-verification"
        ? batch?.unitsOnHand ?? 0
        : null,
    expectedStock,
    decrementQuantity:
      type === "unassigned-decrement" ? decrementQuantity : null,
    createdAt: `${createdDate}T${String(8 + (sequence % 4)).padStart(
      2,
      "0"
    )}:15:00`,
    dueAt: `${action.dueDate}T${String(dueHour).padStart(2, "0")}:00:00`,
    completedAt: action.completedAt
      ? `${action.completedAt}T${String(Math.min(dueHour, 16)).padStart(
          2,
          "0"
        )}:20:00`
      : undefined,
    assignedTo: getAssignee(branch, sequence),
    reason: getReason(type, batch, product, fifoViolations, decrementQuantity),
    why: getWhy(type, fifoViolations),
    evidence: getEvidence(
      type,
      batch,
      product,
      expectedStock,
      decrementQuantity,
      fifoViolations,
      fifoRisk
    ),
    recommendedAction: getRecommendedAction(type, batch),
    previousFifoViolations: fifoViolations,
    fifoRisk,
  };
}

export const actionCenterItems: ActionCenterItem[] = operationalActions
  .map(buildAction)
  .filter((action): action is ActionCenterItem => Boolean(action));
