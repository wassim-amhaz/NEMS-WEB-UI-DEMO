import {
  DEMO_TODAY,
  batches,
  branches,
  expiryLossEvents,
  fifoLossEvents,
  lossEvents,
  openActions,
  operationalActions,
  products,
  type Batch,
  type LossEvent,
  type LossEventType,
  type Product,
} from "./nems-data";
import { getVelocityLabel } from "./operational-helpers";

export type AttentionWindow = "overdue" | "today" | "next3" | "next7";

export type AttentionItem = {
  batch: Batch;
  product: Product;
  daysUntilRemoval: number;
  valueAtRisk: number;
};

export type RankedLossProduct = {
  product: Product;
  units: number;
  value: number;
  events: number;
  velocity: number;
  velocityLabel: "High" | "Medium" | "Low";
  trendPercent: number;
  severity: "critical" | "high" | "medium";
};

export type BranchDashboard = {
  branchId: string;
  trackedProductCount: number;
  openActionCount: number;
  metrics: {
    fifoLossRate: number;
    fifoUnits: number;
    fifoDelta: number;
    expiryLoss: number;
    expiryUnits: number;
    expiryDelta: number;
    avoidableLoss: number;
    avoidableDelta: number;
    removalCompliance: number;
    removalDelta: number;
    actionCompliance: number;
    actionDelta: number;
    expiryExposure: number;
    exposureUnits: number;
    exposureDelta: number;
  };
  attention: Record<AttentionWindow, AttentionItem[]>;
  topFifoLoss: RankedLossProduct[];
  topExpiryLoss: RankedLossProduct[];
  avoidableLoss: {
    fifo: number;
    earlyRemoval: number;
    preventableExpiry: number;
    total: number;
  };
  lossBreakdown: Array<{
    key: LossEventType;
    label: string;
    value: number;
    units: number;
  }>;
};

const DAY_MS = 86_400_000;

function daysBetween(date: string, comparison = DEMO_TODAY) {
  return Math.round(
    (new Date(`${date}T12:00:00Z`).getTime() -
      new Date(`${comparison}T12:00:00Z`).getTime()) /
      DAY_MS
  );
}

function sum(events: LossEvent[], field: "units" | "value") {
  return events.reduce((total, event) => total + event[field], 0);
}

function isTrackedProduct(productId: string | undefined, branchId: string) {
  if (!productId) return false;
  return products.some(
    (product) =>
      product.id === productId && product.trackedBranchIds.includes(branchId)
  );
}

function getTrackedLossEvents(branchId: string, type?: LossEventType) {
  return lossEvents.filter(
    (event) =>
      event.branchId === branchId &&
      isTrackedProduct(event.productId, branchId) &&
      (!type || event.type === type)
  );
}

function rankLossProducts(
  branchId: string,
  type: "fifo" | "expiry"
): RankedLossProduct[] {
  const grouped = new Map<
    string,
    { product: Product; units: number; value: number; events: number }
  >();

  getTrackedLossEvents(branchId, type).forEach((event) => {
    const product = products.find((item) => item.id === event.productId);
    if (!product) return;
    const current = grouped.get(product.id) ?? {
      product,
      units: 0,
      value: 0,
      events: 0,
    };
    current.units += event.units;
    current.value += event.value;
    current.events += 1;
    grouped.set(product.id, current);
  });

  const ranked = [...grouped.values()].sort((a, b) => b.value - a.value);
  const maxValue = ranked[0]?.value ?? 0;

  return ranked.slice(0, 5).map((item, index) => {
    const velocity = item.product.salesVelocity[branchId];
    return {
      ...item,
      value: Number(item.value.toFixed(2)),
      velocity,
      velocityLabel: getVelocityLabel(velocity),
      trendPercent: [-18, -9, 14, 7, -5][index],
      severity:
        item.value >= maxValue * 0.75 || item.events >= 4
          ? "critical"
          : item.value >= maxValue * 0.4 || item.events >= 3
            ? "high"
            : "medium",
    };
  });
}

const metricDeltas = {
  "br-downtown": {
    fifo: -2.4,
    expiry: -3.8,
    avoidable: -1.9,
    removal: 1.1,
    action: 2.2,
    exposure: 4.5,
  },
  "br-north": {
    fifo: 4.2,
    expiry: 13.7,
    avoidable: 9.2,
    removal: -1.6,
    action: -2.4,
    exposure: 11.5,
  },
  "br-airport": {
    fifo: -18.4,
    expiry: -15.2,
    avoidable: -16,
    removal: 4.2,
    action: -8.7,
    exposure: -12.8,
  },
  "br-hamra": {
    fifo: -14,
    expiry: -9,
    avoidable: -12,
    removal: 1.8,
    action: 3.5,
    exposure: 15.6,
  },
} as const;

export function getBranchDashboard(branchId: string): BranchDashboard {
  const validBranchId = branches.some((branch) => branch.id === branchId)
    ? branchId
    : branches[0].id;
  const deltas =
    metricDeltas[validBranchId as keyof typeof metricDeltas] ??
    metricDeltas[branches[0].id as keyof typeof metricDeltas];
  const trackedProductIds = new Set(
    products
      .filter((product) => product.trackedBranchIds.includes(validBranchId))
      .map((product) => product.id)
  );

  const fifoEvents = getTrackedLossEvents(validBranchId, "fifo");
  const expiryEvents = getTrackedLossEvents(validBranchId, "expiry");
  const earlyRemovalEvents = getTrackedLossEvents(
    validBranchId,
    "early-removal"
  );

  const trackedMonthlySales = products
    .filter((product) => product.nemsTracked)
    .filter((product) => product.trackedBranchIds.includes(validBranchId))
    .reduce(
      (total, product) =>
        total + (product.salesVelocity[validBranchId] ?? 0) * 30,
      0
    );
  const fifoUnits = sum(fifoEvents, "units");

  const historicBatches = batches.filter(
    (batch) =>
      batch.branchId === validBranchId &&
      batch.status === "removed" &&
      trackedProductIds.has(batch.productId) &&
      batch.removedAt
  );
  const removalCompliance =
    (historicBatches.filter(
      (batch) => batch.removedAt && batch.removedAt <= batch.removalDate
    ).length /
      Math.max(historicBatches.length, 1)) *
    100;

  const completedActions = operationalActions.filter(
    (action) =>
      action.branchId === validBranchId &&
      action.status === "completed" &&
      isTrackedProduct(action.productId, validBranchId)
  );
  const actionCompliance =
    (completedActions.filter(
      (action) => action.completedAt && action.completedAt <= action.dueDate
    ).length /
      Math.max(completedActions.length, 1)) *
    100;

  const activeExposureBatches = batches.filter((batch) => {
    const daysToExpiry = daysBetween(batch.expiryDate);
    return (
      batch.branchId === validBranchId &&
      batch.status === "active" &&
      trackedProductIds.has(batch.productId) &&
      daysToExpiry >= -4 &&
      daysToExpiry <= 14
    );
  });

  const attentionItems: AttentionItem[] = batches
    .filter(
      (batch) =>
        batch.branchId === validBranchId &&
        batch.status === "active" &&
        trackedProductIds.has(batch.productId)
    )
    .map((batch) => {
      const product = products.find((item) => item.id === batch.productId)!;
      return {
        batch,
        product,
        daysUntilRemoval: daysBetween(batch.removalDate),
        valueAtRisk: Number((batch.unitsOnHand * batch.unitCost).toFixed(2)),
      };
    })
    .filter((item) => item.daysUntilRemoval <= 7)
    .sort(
      (a, b) =>
        a.daysUntilRemoval - b.daysUntilRemoval || b.valueAtRisk - a.valueAtRisk
    );

  const fifoAvoidable = sum(fifoEvents, "value");
  const earlyRemovalAvoidable = earlyRemovalEvents.reduce(
    (total, event) => total + event.value * event.preventablePercent,
    0
  );
  const preventableExpiry = expiryEvents.reduce(
    (total, event) => total + event.value * event.preventablePercent,
    0
  );
  const avoidableTotal =
    fifoAvoidable + earlyRemovalAvoidable + preventableExpiry;

  const expiryLoss = sum(expiryEvents, "value");
  const expiryUnits = sum(expiryEvents, "units");
  const expiryExposure = activeExposureBatches.reduce(
    (total, batch) => total + batch.unitsOnHand * batch.unitCost,
    0
  );
  const exposureUnits = activeExposureBatches.reduce(
    (total, batch) => total + batch.unitsOnHand,
    0
  );

  return {
    branchId: validBranchId,
    trackedProductCount: trackedProductIds.size,
    openActionCount: openActions.filter(
      (action) =>
        action.branchId === validBranchId &&
        isTrackedProduct(action.productId, validBranchId)
    ).length,
    metrics: {
      fifoLossRate: (fifoUnits / Math.max(trackedMonthlySales + fifoUnits, 1)) * 100,
      fifoUnits,
      fifoDelta: deltas.fifo,
      expiryLoss,
      expiryUnits,
      expiryDelta: deltas.expiry,
      avoidableLoss: avoidableTotal,
      avoidableDelta: deltas.avoidable,
      removalCompliance,
      removalDelta: deltas.removal,
      actionCompliance,
      actionDelta: deltas.action,
      expiryExposure,
      exposureUnits,
      exposureDelta: deltas.exposure,
    },
    attention: {
      overdue: attentionItems.filter((item) => item.daysUntilRemoval < 0),
      today: attentionItems.filter((item) => item.daysUntilRemoval === 0),
      next3: attentionItems.filter(
        (item) => item.daysUntilRemoval >= 1 && item.daysUntilRemoval <= 3
      ),
      next7: attentionItems.filter(
        (item) => item.daysUntilRemoval >= 4 && item.daysUntilRemoval <= 7
      ),
    },
    topFifoLoss: rankLossProducts(validBranchId, "fifo"),
    topExpiryLoss: rankLossProducts(validBranchId, "expiry"),
    avoidableLoss: {
      fifo: Number(fifoAvoidable.toFixed(2)),
      earlyRemoval: Number(earlyRemovalAvoidable.toFixed(2)),
      preventableExpiry: Number(preventableExpiry.toFixed(2)),
      total: Number(avoidableTotal.toFixed(2)),
    },
    lossBreakdown: [
      {
        key: "fifo",
        label: "FIFO",
        value: Number(sum(fifoEvents, "value").toFixed(2)),
        units: sum(fifoEvents, "units"),
      },
      {
        key: "expiry",
        label: "Expiry",
        value: Number(expiryLoss.toFixed(2)),
        units: expiryUnits,
      },
      {
        key: "early-removal",
        label: "Early-Removal Loss",
        value: Number(sum(earlyRemovalEvents, "value").toFixed(2)),
        units: sum(earlyRemovalEvents, "units"),
      },
    ],
  };
}

export function getTrackedEventTotal(
  branchId: string,
  events: LossEvent[] = [...fifoLossEvents, ...expiryLossEvents]
) {
  return events
    .filter(
      (event) =>
        event.branchId === branchId && isTrackedProduct(event.productId, branchId)
    )
    .reduce((total, event) => total + event.value, 0);
}
