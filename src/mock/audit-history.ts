import { actionCenterItems, type ActionCenterItem } from "./action-center";
import {
  DEMO_TODAY,
  batches,
  branches,
  lossEvents,
  products,
  type Batch,
  type Branch,
  type Product,
} from "./nems-data";

export type AuditEventType =
  | "action-created"
  | "action-completed"
  | "expiry-removal"
  | "recount-completed"
  | "batch-created"
  | "batch-information-updated"
  | "transfer-batch-information-entered"
  | "unassigned-decrement-resolved"
  | "fifo-verification"
  | "fifo-loss-recorded"
  | "expiry-loss-recorded"
  | "product-tracking-changed"
  | "remove-before-changed"
  | "correction"
  | "cancellation"
  | "reversal";

export type AuditEventStatus =
  | "recorded"
  | "completed"
  | "open"
  | "corrected"
  | "reversed"
  | "cancelled";

export type AuditEntityType =
  | "Action"
  | "Batch"
  | "Product"
  | "Inventory"
  | "Loss"
  | "Configuration";

export type AuditEvent = {
  id: string;
  timestamp: string;
  type: AuditEventType;
  status: AuditEventStatus;
  actor: string;
  actorRole: string;
  actorKind: "operator" | "supervisor" | "system";
  branch: Branch;
  entityType: AuditEntityType;
  product?: Product;
  batch?: Batch;
  action?: ActionCenterItem;
  description: string;
  previousValue?: string;
  newValue?: string;
  quantity?: number;
  outcome?: string;
  reason?: string;
  note?: string;
  sourceEventId?: string;
  correctableField?: string;
  canCorrect: boolean;
  canReverse: boolean;
  reversalMode?: "reversal" | "cancellation";
};

export const auditEventTypeLabels: Record<AuditEventType, string> = {
  "action-created": "Action Created",
  "action-completed": "Action Completed",
  "expiry-removal": "Expiry Removal",
  "recount-completed": "Recount Completed",
  "batch-created": "Batch Created",
  "batch-information-updated": "Batch Information Updated",
  "transfer-batch-information-entered": "Transfer Batch Information Entered",
  "unassigned-decrement-resolved": "Unassigned Decrement Resolved",
  "fifo-verification": "FIFO Verification",
  "fifo-loss-recorded": "FIFO Loss Recorded",
  "expiry-loss-recorded": "Expiry Loss Recorded",
  "product-tracking-changed": "Product Tracking Changed",
  "remove-before-changed": "Remove Before Changed",
  correction: "Correction",
  cancellation: "Cancellation",
  reversal: "Reversal",
};

const DAY_MS = 86_400_000;

function shiftDate(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function getCompletedType(action: ActionCenterItem): AuditEventType {
  switch (action.type) {
    case "expiry-removal":
      return "expiry-removal";
    case "recount":
      return "recount-completed";
    case "missing-batch-information":
      return "batch-information-updated";
    case "transfer-arrival":
      return "transfer-batch-information-entered";
    case "unassigned-decrement":
      return "unassigned-decrement-resolved";
    case "fifo-verification":
      return "fifo-verification";
    default:
      return "action-completed";
  }
}

function getCompletedChange(action: ActionCenterItem) {
  switch (action.type) {
    case "expiry-removal":
      return {
        previousValue: `${action.quantity ?? 0} units expected`,
        newValue: `${action.quantity ?? 0} units removed`,
        quantity: action.quantity ?? 0,
        field: "Removed quantity",
      };
    case "recount": {
      const counted = Math.max(
        0,
        action.expectedStock - (Number(action.id.at(-1)) % 4)
      );
      return {
        previousValue: `${action.expectedStock} system units`,
        newValue: `${counted} counted units`,
        quantity: counted,
        field: "Physical count",
      };
    }
    case "missing-batch-information":
    case "transfer-arrival":
      return {
        previousValue: "Expiry information pending",
        newValue: action.batch?.expiryDate ?? "Expiry label confirmed",
        quantity: action.quantity ?? action.batch?.initialUnits,
        field: "Expiry date / quantity",
      };
    case "unassigned-decrement":
      return {
        previousValue: `${action.decrementQuantity ?? 0} units unassigned`,
        newValue: `Assigned to ${action.batch?.lotNumber ?? "verified batch"}`,
        quantity: action.decrementQuantity ?? undefined,
        field: "Assigned batch",
      };
    case "fifo-verification":
      return {
        previousValue: "Physical sequence unverified",
        newValue: "FIFO sequence physically verified",
        quantity: action.quantity ?? undefined,
        field: "Verification result",
      };
    default:
      return {
        previousValue: "Operational check open",
        newValue: "Check completed",
        quantity: undefined,
        field: "Outcome",
      };
  }
}

const actionEvents: AuditEvent[] = actionCenterItems.flatMap(
  (action, index) => {
    const createdBatch =
      action.batch && action.batch.receivedDate <= action.createdAt.slice(0, 10)
        ? action.batch
        : undefined;
    const created: AuditEvent = {
      id: `AUD-ACT-${String(index + 1).padStart(4, "0")}`,
      timestamp: action.createdAt,
      type: "action-created",
      status: action.status === "completed" ? "recorded" : "open",
      actor: "NEMS Rules Engine",
      actorRole: "Automated operational monitoring",
      actorKind: "system",
      branch: action.branch,
      entityType: "Action",
      product: action.product,
      batch: createdBatch,
      action,
      description: `${action.typeLabel} action created for ${action.product.name}.`,
      newValue: `${action.priority} priority · due ${action.dueAt.slice(
        0,
        10
      )}`,
      outcome: action.reason,
      note: action.why,
      canCorrect: false,
      canReverse: action.status !== "completed",
      reversalMode: "cancellation",
    };

    if (!action.completedAt) return [created];
    const completedBatch =
      action.batch &&
      action.batch.receivedDate <= action.completedAt.slice(0, 10)
        ? action.batch
        : undefined;
    const change = getCompletedChange(action);
    const completedType = getCompletedType(action);
    const completed: AuditEvent = {
      id: `AUD-CMP-${String(index + 1).padStart(4, "0")}`,
      timestamp: action.completedAt,
      type: completedType,
      status: "completed",
      actor: action.assignedTo,
      actorRole: "Branch operator",
      actorKind: "operator",
      branch: action.branch,
      entityType:
        action.type === "recount" || action.type === "unassigned-decrement"
          ? "Inventory"
          : action.type === "missing-batch-information" ||
            action.type === "transfer-arrival"
          ? "Batch"
          : "Action",
      product: action.product,
      batch: completedBatch,
      action,
      description: `${action.typeLabel} completed for ${action.product.name}.`,
      previousValue: change.previousValue,
      newValue: change.newValue,
      quantity: change.quantity,
      outcome: action.recommendedAction,
      reason: action.reason,
      note: "Completion retained as part of the permanent operational record.",
      sourceEventId: created.id,
      correctableField: change.field,
      canCorrect:
        action.type !== "fifo-verification" &&
        action.type !== "urgent-operational-check",
      canReverse:
        action.type === "expiry-removal" ||
        action.type === "recount" ||
        action.type === "unassigned-decrement",
      reversalMode: "reversal",
    };
    return [created, completed];
  }
);

const batchEvents: AuditEvent[] = batches
  .filter((batch) => {
    const product = products.find((item) => item.id === batch.productId);
    return product?.demoTier === "primary" && product.nemsTracked;
  })
  .slice(0, 96)
  .flatMap((batch, index) => {
    const product = products.find((item) => item.id === batch.productId)!;
    const branch = branches.find((item) => item.id === batch.branchId)!;
    const created: AuditEvent = {
      id: `AUD-BAT-${String(index + 1).padStart(4, "0")}`,
      timestamp: `${batch.receivedDate}T08:${String((index * 7) % 60).padStart(
        2,
        "0"
      )}:00`,
      type: "batch-created",
      status: "recorded",
      actor: index % 5 === 0 ? branch.manager : "Receiving Team",
      actorRole: index % 5 === 0 ? "Branch supervisor" : "Branch operator",
      actorKind: index % 5 === 0 ? "supervisor" : "operator",
      branch,
      entityType: "Batch",
      product,
      batch,
      description: `${batch.lotNumber} created with ${batch.initialUnits} received units.`,
      newValue: `${batch.initialUnits} units · expiry ${batch.expiryDate}`,
      quantity: batch.initialUnits,
      outcome: "Batch entered NEMS tracked inventory.",
      note: "Supplier receiving record linked to the tracked product.",
      canCorrect: false,
      canReverse: false,
    };
    const information: AuditEvent = {
      id: `AUD-INF-${String(index + 1).padStart(4, "0")}`,
      timestamp: `${
        shiftDate(batch.receivedDate, 1) > DEMO_TODAY
          ? DEMO_TODAY
          : shiftDate(batch.receivedDate, 1)
      }T09:${String(
        (index * 11) % 60
      ).padStart(2, "0")}:00`,
      type: "batch-information-updated",
      status: "completed",
      actor: index % 4 === 0 ? branch.manager : "Receiving Team",
      actorRole: index % 4 === 0 ? "Branch supervisor" : "Branch operator",
      actorKind: index % 4 === 0 ? "supervisor" : "operator",
      branch,
      entityType: "Batch",
      product,
      batch,
      description: `Expiry and calculated removal information confirmed for ${batch.lotNumber}.`,
      previousValue: "Expiry label pending verification",
      newValue: `Expiry ${batch.expiryDate} · remove ${batch.removalDate}`,
      outcome: `Remove Before rule applied: ${
        product.removeBeforeDays ?? 0
      } days.`,
      sourceEventId: created.id,
      correctableField: "Expiry date",
      canCorrect: true,
      canReverse: false,
    };
    return [created, information];
  });

const lossAuditEvents: AuditEvent[] = lossEvents.map((event, index) => {
  const product = products.find((item) => item.id === event.productId)!;
  const branch = branches.find((item) => item.id === event.branchId)!;
  const batch = batches
    .filter(
      (item) =>
        item.productId === event.productId &&
        item.branchId === event.branchId &&
        item.receivedDate <= event.occurredAt &&
        (event.type !== "expiry" || item.expiryDate <= event.occurredAt)
    )
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))[0];
  const isFifo = event.type === "fifo";
  return {
    id: `AUD-LOS-${String(index + 1).padStart(4, "0")}`,
    timestamp: `${event.occurredAt}T14:${String((index * 13) % 60).padStart(
      2,
      "0"
    )}:00`,
    type: isFifo ? "fifo-loss-recorded" : "expiry-loss-recorded",
    status: "recorded",
    actor: isFifo ? "Inventory Control" : branch.manager,
    actorRole: isFifo ? "Physical verification team" : "Branch supervisor",
    actorKind: "supervisor",
    branch,
    entityType: "Loss",
    product,
    batch,
    description: `${
      isFifo
        ? "Confirmed FIFO"
        : event.type === "expiry"
        ? "Expiry"
        : "Early-removal"
    } loss recorded for ${product.name}.`,
    newValue: `${event.units} units · $${event.value.toFixed(2)}`,
    quantity: event.units,
    outcome: `${Math.round(
      event.preventablePercent * 100
    )}% estimated preventable.`,
    note: "Historical loss records are retained as read-only operational history.",
    canCorrect: false,
    canReverse: false,
  } satisfies AuditEvent;
});

const configurationEvents: AuditEvent[] = branches.flatMap(
  (branch, branchIndex) => {
    const branchProducts = products
      .filter(
        (product) =>
          product.demoTier === "primary" &&
          product.trackedBranchIds.includes(branch.id)
      )
      .slice(0, 3);
    return branchProducts.flatMap((product, productIndex) => {
      const baseIndex = branchIndex * 3 + productIndex + 1;
      return [
        {
          id: `AUD-TRK-${String(baseIndex).padStart(4, "0")}`,
          timestamp: `${shiftDate(
            DEMO_TODAY,
            -(4 + productIndex + branchIndex)
          )}T11:20:00`,
          type: "product-tracking-changed",
          status: "completed",
          actor: branch.manager,
          actorRole: "Branch supervisor",
          actorKind: "supervisor",
          branch,
          entityType: "Configuration",
          product,
          description: `${product.name} enabled for NEMS tracking at ${branch.name}.`,
          previousValue: "Untracked",
          newValue: "Tracked",
          outcome: "Product entered branch-level operational intelligence.",
          correctableField: "Tracking status",
          canCorrect: false,
          canReverse: false,
        },
        {
          id: `AUD-RMB-${String(baseIndex).padStart(4, "0")}`,
          timestamp: `${shiftDate(
            DEMO_TODAY,
            -(2 + productIndex + branchIndex)
          )}T13:40:00`,
          type: "remove-before-changed",
          status: "completed",
          actor: branch.manager,
          actorRole: "Branch supervisor",
          actorKind: "supervisor",
          branch,
          entityType: "Configuration",
          product,
          description: `Remove Before configuration confirmed for ${product.name}.`,
          previousValue: `${Math.max(
            0,
            (product.removeBeforeDays ?? 1) - 1
          )} days`,
          newValue: `${product.removeBeforeDays ?? 0} days`,
          outcome: "Future batch removal dates use the updated fixed offset.",
          correctableField: "Remove Before days",
          canCorrect: true,
          canReverse: false,
        },
      ] satisfies AuditEvent[];
    });
  }
);

function addOversightStories(events: AuditEvent[]) {
  const result = events.map((event) => ({ ...event }));
  const recount = result.find((event) => event.type === "recount-completed");
  const batchCorrection = result.find(
    (event) =>
      event.type === "batch-information-updated" &&
      event.branch.id !== recount?.branch.id
  );
  const removalReversal = result.find(
    (event) =>
      event.type === "expiry-removal" &&
      event.branch.id !== recount?.branch.id &&
      event.branch.id !== batchCorrection?.branch.id
  );
  const candidates = [recount, batchCorrection, removalReversal].filter(
    (event): event is AuditEvent => Boolean(event)
  );

  const additions: AuditEvent[] = [];
  candidates.forEach((original, index) => {
    if (index < 2) {
      original.status = "corrected";
      additions.push({
        ...original,
        id: `AUD-COR-${String(index + 1).padStart(4, "0")}`,
        timestamp: `${DEMO_TODAY}T${14 + index}:35:00`,
        type: "correction",
        status: "completed",
        actor: original.branch.manager,
        actorRole: "Branch supervisor",
        actorKind: "supervisor",
        description: `${
          original.correctableField ?? "Recorded value"
        } corrected without removing the original event.`,
        previousValue: original.newValue,
        newValue:
          index === 0
            ? `${Math.max(0, (original.quantity ?? 12) - 1)} units confirmed`
            : `${original.batch?.expiryDate ?? DEMO_TODAY} label reconfirmed`,
        quantity:
          index === 0 ? Math.max(0, (original.quantity ?? 12) - 1) : undefined,
        reason:
          index === 0
            ? "Supervisor recount confirmed one damaged unit."
            : "Supplier label was re-read during receiving review.",
        note: "Original record remains visible and linked below.",
        sourceEventId: original.id,
        canCorrect: false,
        canReverse: false,
      });
    } else {
      original.status = "reversed";
      additions.push({
        ...original,
        id: "AUD-REV-0001",
        timestamp: `${DEMO_TODAY}T16:10:00`,
        type: "reversal",
        status: "completed",
        actor: original.branch.manager,
        actorRole: "Branch supervisor",
        actorKind: "supervisor",
        description:
          "Recorded operation reversed while preserving the original event.",
        previousValue: original.newValue,
        newValue: "Operation reversed; stock restored for physical recheck",
        reason: "Removal was posted against the wrong physical tote.",
        note: "A new operational action is required before another removal is posted.",
        sourceEventId: original.id,
        canCorrect: false,
        canReverse: false,
      });
    }
  });

  const cancellationSource = result.find(
    (event) =>
      event.type === "action-created" &&
      event.status === "open" &&
      !candidates.some((candidate) => candidate.branch.id === event.branch.id)
  );
  if (cancellationSource) {
    cancellationSource.status = "cancelled";
    additions.push({
      ...cancellationSource,
      id: "AUD-CAN-0001",
      timestamp: `${DEMO_TODAY}T16:45:00`,
      type: "cancellation",
      status: "completed",
      actor: cancellationSource.branch.manager,
      actorRole: "Branch supervisor",
      actorKind: "supervisor",
      description:
        "Open action cancelled while preserving its original creation record.",
      previousValue: cancellationSource.newValue,
      newValue: "Action cancelled before execution",
      reason:
        "A duplicate physical check was already active for this stock condition.",
      note: "The original automated action remains visible for oversight.",
      sourceEventId: cancellationSource.id,
      canCorrect: false,
      canReverse: false,
    });
  }
  return [...result, ...additions];
}

export const auditEvents: AuditEvent[] = addOversightStories([
  ...actionEvents,
  ...batchEvents,
  ...lossAuditEvents,
  ...configurationEvents,
]).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

export const auditActors = [
  ...new Set(auditEvents.map((event) => event.actor)),
].sort((a, b) => a.localeCompare(b));

export const auditEntityTypes: AuditEntityType[] = [
  "Action",
  "Batch",
  "Product",
  "Inventory",
  "Loss",
  "Configuration",
];
