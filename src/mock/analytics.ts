import { getBranchDashboard } from "./dashboard";
import { getNetworkDashboard } from "./network-dashboard";
import {
  DEMO_TODAY,
  batches,
  branches,
  categories,
  lossEvents,
  products,
  suppliers,
  type Branch,
  type LossEvent,
  type LossEventType,
  type Product,
} from "./nems-data";
import { HIGH_VELOCITY_THRESHOLD } from "./operational-helpers";

export type AnalyticsRange = 7 | 30 | 90 | 180;
export type AnalyticsLossFilter = "all" | LossEventType;
export type AnalyticsDirection = "improving" | "stable" | "deteriorating";

export type AnalyticsFilters = {
  branchId: string;
  rangeDays: AnalyticsRange;
  categoryId: string;
  supplierId: string;
  lossType: AnalyticsLossFilter;
};

export type TrendPoint = {
  label: string;
  fifo: number;
  expiry: number;
  avoidable: number;
};

export type CompliancePoint = {
  label: string;
  removal: number;
  action: number;
};

export type AnalyticsDriver = {
  product: Product;
  totalLoss: number;
  fifoLoss: number;
  expiryLoss: number;
  earlyRemovalLoss: number;
  velocity: number;
  primaryDriver: "FIFO" | "Expiry" | "Early Removal";
  trend: number;
  direction: AnalyticsDirection;
};

export type AnalyticsBranchPerformance = {
  branch: Branch;
  fifoLoss: number;
  expiryLoss: number;
  avoidableLoss: number;
  removalCompliance: number;
  actionCompliance: number;
  trend: number;
  direction: AnalyticsDirection;
};

export type CategoryPerformance = {
  id: string;
  name: string;
  totalLoss: number;
  fifoLoss: number;
  expiryLoss: number;
  productCount: number;
  trend: number;
  direction: AnalyticsDirection;
};

export type VelocityExpiryPoint = {
  id: string;
  name: string;
  velocity: number;
  expiryLoss: number;
  category: string;
  zone:
    | "healthy"
    | "monitor"
    | "demand-overstock-risk"
    | "high-volume-expiry-anomaly";
  zoneLabel:
    | "Healthy"
    | "Monitor"
    | "Demand / Overstock Risk"
    | "High-Volume Expiry Anomaly";
};

export const VELOCITY_EXPLANATION_THRESHOLD = HIGH_VELOCITY_THRESHOLD;
export const EXPIRY_LOSS_ATTENTION_THRESHOLD = 75;

export type AnalyticsInsight = {
  kind: "improving" | "attention";
  title: string;
  detail: string;
};

export type AnalyticsData = {
  contextLabel: string;
  metrics: {
    fifoLoss: number;
    fifoDelta: number;
    expiryLoss: number;
    expiryDelta: number;
    avoidableLoss: number;
    avoidableDelta: number;
    removalCompliance: number;
    removalDelta: number;
    actionCompliance: number;
    actionDelta: number;
    expiryExposure: number;
    exposureDelta: number;
  };
  lossTrend: TrendPoint[];
  complianceTrend: CompliancePoint[];
  composition: Array<{
    key: string;
    label: string;
    value: number;
  }>;
  branchPerformance: AnalyticsBranchPerformance[];
  categoryPerformance: CategoryPerformance[];
  topDrivers: AnalyticsDriver[];
  velocityExpiry: VelocityExpiryPoint[];
  insights: AnalyticsInsight[];
};

const DAY_MS = 86_400_000;

function sum(events: LossEvent[], field: "units" | "value") {
  return events.reduce((total, event) => total + event[field], 0);
}

function average(values: number[]) {
  return (
    values.reduce((total, value) => total + value, 0) /
    Math.max(values.length, 1)
  );
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function shiftDate(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function daysBetween(date: string, comparison = DEMO_TODAY) {
  return Math.round(
    (new Date(`${date}T12:00:00Z`).getTime() -
      new Date(`${comparison}T12:00:00Z`).getTime()) /
      DAY_MS
  );
}

function hash(value: string) {
  return [...value].reduce(
    (total, character, index) =>
      (total + character.charCodeAt(0) * (index + 3)) % 10_007,
    0
  );
}

function directionFromTrend(trend: number): AnalyticsDirection {
  return trend <= -3 ? "improving" : trend >= 3 ? "deteriorating" : "stable";
}

function matchesProductFilters(
  product: Product,
  categoryId: string,
  supplierId: string
) {
  return (
    (categoryId === "all" || product.categoryId === categoryId) &&
    (supplierId === "all" || product.supplierId === supplierId)
  );
}

function getScopedEvents(
  branchIds: string[],
  categoryId: string,
  supplierId: string,
  lossType: AnalyticsLossFilter
) {
  return lossEvents.filter((event) => {
    const product = products.find((item) => item.id === event.productId);
    return Boolean(
      product &&
        branchIds.includes(event.branchId) &&
        product.trackedBranchIds.includes(event.branchId) &&
        matchesProductFilters(product, categoryId, supplierId) &&
        (lossType === "all" || event.type === lossType)
    );
  });
}

function getAvoidableLoss(events: LossEvent[]) {
  return events.reduce((total, event) => {
    if (event.type === "fifo") return total + event.value;
    return total + event.value * event.preventablePercent;
  }, 0);
}

function getRangeBucketCount(rangeDays: AnalyticsRange) {
  if (rangeDays === 7) return 7;
  if (rangeDays === 30) return 10;
  return 12;
}

function distributeTotal(
  total: number,
  count: number,
  delta: number,
  seed: number
) {
  const middle = Math.max((count - 1) / 2, 1);
  const weights = Array.from({ length: count }, (_, index) => {
    const trend = (delta / 100) * ((index - middle) / middle) * 0.75;
    const wave = Math.sin(index * 1.63 + seed) * 0.13;
    return Math.max(0.25, 1 + trend + wave);
  });
  const weightTotal = weights.reduce((current, value) => current + value, 0);
  return weights.map((weight) => round((total * weight) / weightTotal));
}

function getBucketLabels(rangeDays: AnalyticsRange, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const daysAgo = Math.round(
      rangeDays - 1 - (index * (rangeDays - 1)) / Math.max(count - 1, 1)
    );
    const date = new Date(`${shiftDate(DEMO_TODAY, -daysAgo)}T12:00:00Z`);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  });
}

function getLossTrend(
  rangeDays: AnalyticsRange,
  totals: { fifo: number; expiry: number; avoidable: number },
  deltas: { fifo: number; expiry: number; avoidable: number },
  seed: number
) {
  const count = getRangeBucketCount(rangeDays);
  const labels = getBucketLabels(rangeDays, count);
  const fifo = distributeTotal(totals.fifo, count, deltas.fifo, seed + 1);
  const expiry = distributeTotal(totals.expiry, count, deltas.expiry, seed + 2);
  const avoidable = distributeTotal(
    totals.avoidable,
    count,
    deltas.avoidable,
    seed + 3
  );
  return labels.map((label, index) => ({
    label,
    fifo: fifo[index],
    expiry: expiry[index],
    avoidable: avoidable[index],
  }));
}

function getComplianceTrend(
  rangeDays: AnalyticsRange,
  current: { removal: number; action: number },
  deltas: { removal: number; action: number },
  seed: number
) {
  const count = getRangeBucketCount(rangeDays);
  const labels = getBucketLabels(rangeDays, count);
  return labels.map((label, index) => {
    const progress = index / Math.max(count - 1, 1);
    const wave = Math.sin(index * 1.4 + seed) * 0.45;
    return {
      label,
      removal: round(
        Math.min(
          100,
          Math.max(0, current.removal - deltas.removal * (1 - progress) + wave)
        ),
        1
      ),
      action: round(
        Math.min(
          100,
          Math.max(
            0,
            current.action - deltas.action * (1 - progress) - wave * 0.7
          )
        ),
        1
      ),
    };
  });
}

function getProductVelocity(product: Product, branchIds: string[]) {
  const velocities = branchIds
    .filter((branchId) => product.trackedBranchIds.includes(branchId))
    .map((branchId) => product.salesVelocity[branchId] ?? 0);
  return average(velocities);
}

function getDriverTrend(
  product: Product,
  branchIds: string[],
  fifoLoss: number,
  expiryLoss: number
) {
  const dashboards = branchIds.map(getBranchDashboard);
  const profileTrend = average(
    dashboards.map((dashboard) =>
      expiryLoss > fifoLoss
        ? dashboard.metrics.expiryDelta
        : dashboard.metrics.fifoDelta
    )
  );
  return round(profileTrend + ((hash(product.id) % 9) - 4) * 0.8, 1);
}

function getTopDrivers(
  events: LossEvent[],
  branchIds: string[],
  rangeFactor: number
) {
  const grouped = new Map<
    string,
    { product: Product; fifo: number; expiry: number; early: number }
  >();
  events.forEach((event) => {
    const product = products.find((item) => item.id === event.productId);
    if (!product) return;
    const current = grouped.get(product.id) ?? {
      product,
      fifo: 0,
      expiry: 0,
      early: 0,
    };
    if (event.type === "fifo") current.fifo += event.value;
    if (event.type === "expiry") current.expiry += event.value;
    if (event.type === "early-removal") current.early += event.value;
    grouped.set(product.id, current);
  });
  return [...grouped.values()]
    .map((item) => {
      const fifoLoss = Math.round(item.fifo * rangeFactor);
      const expiryLoss = Math.round(item.expiry * rangeFactor);
      const earlyLoss = Math.round(item.early * rangeFactor);
      const trend = getDriverTrend(
        item.product,
        branchIds,
        fifoLoss,
        expiryLoss
      );
      return {
        product: item.product,
        totalLoss: fifoLoss + expiryLoss + earlyLoss,
        fifoLoss,
        expiryLoss,
        earlyRemovalLoss: earlyLoss,
        velocity: round(getProductVelocity(item.product, branchIds), 1),
        primaryDriver:
          fifoLoss >= expiryLoss && fifoLoss >= earlyLoss
            ? "FIFO"
            : expiryLoss >= earlyLoss
            ? "Expiry"
            : "Early Removal",
        trend,
        direction: directionFromTrend(trend),
      } satisfies AnalyticsDriver;
    })
    .sort((a, b) => b.totalLoss - a.totalLoss)
    .slice(0, 8);
}

function getBranchPerformance(filters: AnalyticsFilters, rangeFactor: number) {
  return branches.map((branch) => {
    const dashboard = getBranchDashboard(branch.id);
    const branchEvents = getScopedEvents(
      [branch.id],
      filters.categoryId,
      filters.supplierId,
      filters.lossType
    );
    const fifoLoss =
      sum(
        branchEvents.filter((event) => event.type === "fifo"),
        "value"
      ) * rangeFactor;
    const expiryLoss =
      sum(
        branchEvents.filter((event) => event.type === "expiry"),
        "value"
      ) * rangeFactor;
    const avoidableLoss = getAvoidableLoss(branchEvents) * rangeFactor;
    const trend = round(
      average([
        dashboard.metrics.fifoDelta,
        dashboard.metrics.expiryDelta,
        -dashboard.metrics.removalDelta,
        -dashboard.metrics.actionDelta,
      ]),
      1
    );
    return {
      branch,
      fifoLoss: round(fifoLoss),
      expiryLoss: round(expiryLoss),
      avoidableLoss: round(avoidableLoss),
      removalCompliance: round(dashboard.metrics.removalCompliance, 1),
      actionCompliance: round(dashboard.metrics.actionCompliance, 1),
      trend,
      direction: directionFromTrend(trend),
    } satisfies AnalyticsBranchPerformance;
  });
}

function getCategoryPerformance(
  events: LossEvent[],
  branchIds: string[],
  rangeFactor: number
) {
  return categories
    .map((category) => {
      const categoryProducts = products.filter(
        (product) => product.categoryId === category.id
      );
      const productIds = new Set(categoryProducts.map((product) => product.id));
      const categoryEvents = events.filter((event) =>
        productIds.has(event.productId)
      );
      const fifoLoss =
        sum(
          categoryEvents.filter((event) => event.type === "fifo"),
          "value"
        ) * rangeFactor;
      const expiryLoss =
        sum(
          categoryEvents.filter((event) => event.type === "expiry"),
          "value"
        ) * rangeFactor;
      const totalLoss = sum(categoryEvents, "value") * rangeFactor;
      const profileTrend = average(
        branchIds.map((branchId) => {
          const dashboard = getBranchDashboard(branchId);
          return expiryLoss >= fifoLoss
            ? dashboard.metrics.expiryDelta
            : dashboard.metrics.fifoDelta;
        })
      );
      const trend = round(profileTrend + ((hash(category.id) % 7) - 3), 1);
      return {
        id: category.id,
        name: category.name,
        totalLoss: round(totalLoss),
        fifoLoss: round(fifoLoss),
        expiryLoss: round(expiryLoss),
        productCount: categoryProducts.filter((product) =>
          branchIds.some((branchId) =>
            product.trackedBranchIds.includes(branchId)
          )
        ).length,
        trend,
        direction: directionFromTrend(trend),
      } satisfies CategoryPerformance;
    })
    .filter((item) => item.totalLoss > 0)
    .sort((a, b) => b.totalLoss - a.totalLoss)
    .slice(0, 7);
}

function getVelocityExpiry(
  events: LossEvent[],
  branchIds: string[],
  categoryId: string,
  supplierId: string,
  rangeFactor: number
) {
  const expiryByProduct = new Map<string, number>();
  events
    .filter((event) => event.type === "expiry")
    .forEach((event) =>
      expiryByProduct.set(
        event.productId,
        (expiryByProduct.get(event.productId) ?? 0) + event.value * rangeFactor
      )
    );
  const scopedProducts = products.filter(
    (product) =>
      branchIds.some((branchId) =>
        product.trackedBranchIds.includes(branchId)
      ) && matchesProductFilters(product, categoryId, supplierId)
  );
  const problemProducts = scopedProducts
    .filter((product) => (expiryByProduct.get(product.id) ?? 0) > 0)
    .sort(
      (a, b) =>
        (expiryByProduct.get(b.id) ?? 0) - (expiryByProduct.get(a.id) ?? 0)
    )
    .slice(0, 12);
  const healthyProducts = scopedProducts
    .filter((product) => !expiryByProduct.has(product.id))
    .sort((a, b) => hash(a.id) - hash(b.id));
  const lowVelocityHealthy = healthyProducts
    .filter(
      (product) =>
        getProductVelocity(product, branchIds) < VELOCITY_EXPLANATION_THRESHOLD
    )
    .slice(0, 2);
  const highVelocityHealthy = healthyProducts
    .filter(
      (product) =>
        getProductVelocity(product, branchIds) >= VELOCITY_EXPLANATION_THRESHOLD
    )
    .slice(0, 2);
  const displayProducts = [
    ...problemProducts,
    ...lowVelocityHealthy,
    ...highVelocityHealthy,
  ];
  return displayProducts.map((product) => {
    const velocity = round(getProductVelocity(product, branchIds), 1);
    const expiryLoss = round(expiryByProduct.get(product.id) ?? 0);
    const lowVelocity = velocity < VELOCITY_EXPLANATION_THRESHOLD;
    const highExpiryLoss = expiryLoss >= EXPIRY_LOSS_ATTENTION_THRESHOLD;
    const zone: VelocityExpiryPoint["zone"] = highExpiryLoss
      ? lowVelocity
        ? "demand-overstock-risk"
        : "high-volume-expiry-anomaly"
      : lowVelocity
      ? "monitor"
      : "healthy";
    const zoneLabels: Record<
      VelocityExpiryPoint["zone"],
      VelocityExpiryPoint["zoneLabel"]
    > = {
      healthy: "Healthy",
      monitor: "Monitor",
      "demand-overstock-risk": "Demand / Overstock Risk",
      "high-volume-expiry-anomaly": "High-Volume Expiry Anomaly",
    };
    return {
      id: product.id,
      name: product.name,
      velocity,
      expiryLoss,
      category:
        categories.find((category) => category.id === product.categoryId)
          ?.name ?? "Uncategorized",
      zone,
      zoneLabel: zoneLabels[zone],
    } satisfies VelocityExpiryPoint;
  });
}

function getInsights(
  branchId: string,
  branchPerformance: AnalyticsBranchPerformance[],
  topDrivers: AnalyticsDriver[],
  categoryPerformance: CategoryPerformance[]
) {
  const scope =
    branchId === "all"
      ? branchPerformance
      : branchPerformance.filter((item) => item.branch.id === branchId);
  const improving = [...scope].sort((a, b) => a.trend - b.trend)[0];
  const deteriorating = [...scope].sort((a, b) => b.trend - a.trend)[0];
  const weakestAction = [...scope].sort(
    (a, b) => a.actionCompliance - b.actionCompliance
  )[0];
  const driver = topDrivers[0];
  const category = categoryPerformance[0];
  const insights: AnalyticsInsight[] = [];

  if (improving) {
    insights.push({
      kind: "improving",
      title: `${improving.branch.name} loss direction is improving`,
      detail: `Combined operational trend is ${Math.abs(
        improving.trend
      ).toFixed(1)}% better than the previous equivalent period.`,
    });
  }
  if (deteriorating && deteriorating.trend >= 2) {
    insights.push({
      kind: "attention",
      title: `${deteriorating.branch.name} is deteriorating`,
      detail: `Loss and execution signals combine to a ${deteriorating.trend.toFixed(
        1
      )}% adverse direction.`,
    });
  }
  if (weakestAction && weakestAction.actionCompliance < 85) {
    insights.push({
      kind: "attention",
      title: "Action execution needs management attention",
      detail: `${
        weakestAction.branch.name
      } action compliance is ${weakestAction.actionCompliance.toFixed(1)}%.`,
    });
  }
  if (driver) {
    insights.push({
      kind: driver.direction === "improving" ? "improving" : "attention",
      title: `${driver.product.name} remains a leading loss driver`,
      detail: `${
        driver.primaryDriver
      } is the primary cause; current scoped loss is $${driver.totalLoss.toFixed(
        0
      )}.`,
    });
  } else if (category) {
    insights.push({
      kind: "improving",
      title: `${category.name} is operating within the filtered scope`,
      detail: "No significant recurring product loss is present in this view.",
    });
  }
  return insights.slice(0, 4);
}

export function getAnalyticsData(filters: AnalyticsFilters): AnalyticsData {
  const branchIds =
    filters.branchId === "all"
      ? branches.map((branch) => branch.id)
      : branches.some((branch) => branch.id === filters.branchId)
      ? [filters.branchId]
      : branches.map((branch) => branch.id);
  const rangeFactor = filters.rangeDays / 30;
  const scopedEvents = getScopedEvents(
    branchIds,
    filters.categoryId,
    filters.supplierId,
    filters.lossType
  );
  const fifoEvents = scopedEvents.filter((event) => event.type === "fifo");
  const expiryEvents = scopedEvents.filter((event) => event.type === "expiry");
  const earlyEvents = scopedEvents.filter(
    (event) => event.type === "early-removal"
  );
  const dashboards = branchIds.map(getBranchDashboard);
  const network = getNetworkDashboard();
  const baseMetrics =
    filters.branchId === "all" ? network.metrics : dashboards[0].metrics;
  const fifoLoss = sum(fifoEvents, "value") * rangeFactor;
  const expiryLoss = sum(expiryEvents, "value") * rangeFactor;
  const avoidableLoss = getAvoidableLoss(scopedEvents) * rangeFactor;
  const filteredProductIds = new Set(
    products
      .filter((product) =>
        matchesProductFilters(product, filters.categoryId, filters.supplierId)
      )
      .map((product) => product.id)
  );
  const expiryExposure = batches
    .filter(
      (batch) =>
        branchIds.includes(batch.branchId) &&
        batch.status === "active" &&
        filteredProductIds.has(batch.productId) &&
        products.some(
          (product) =>
            product.id === batch.productId &&
            product.trackedBranchIds.includes(batch.branchId)
        ) &&
        daysBetween(batch.expiryDate) >= -4 &&
        daysBetween(batch.expiryDate) <= 14
    )
    .reduce((total, batch) => total + batch.unitsOnHand * batch.unitCost, 0);
  const removalCompliance = average(
    dashboards.map((dashboard) => dashboard.metrics.removalCompliance)
  );
  const actionCompliance = average(
    dashboards.map((dashboard) => dashboard.metrics.actionCompliance)
  );
  const deltas = {
    fifo: baseMetrics.fifoDelta,
    expiry: baseMetrics.expiryDelta,
    avoidable: baseMetrics.avoidableDelta,
    removal: baseMetrics.removalDelta,
    action: baseMetrics.actionDelta,
  };
  const composition = [
    {
      key: "fifo",
      label: "Confirmed FIFO",
      value: sum(fifoEvents, "value") * rangeFactor,
    },
    {
      key: "expiry",
      label: "Expiry Loss",
      value:
        expiryEvents.reduce(
          (total, event) =>
            total + event.value * (1 - event.preventablePercent),
          0
        ) * rangeFactor,
    },
    {
      key: "preventable-expiry",
      label: "Preventable Expiry Loss",
      value:
        expiryEvents.reduce(
          (total, event) => total + event.value * event.preventablePercent,
          0
        ) * rangeFactor,
    },
    {
      key: "early-removal",
      label: "Early-Removal Loss",
      value: sum(earlyEvents, "value") * rangeFactor,
    },
  ].map((item) => ({ ...item, value: round(item.value) }));
  const topDrivers = getTopDrivers(scopedEvents, branchIds, rangeFactor);
  const branchPerformance = getBranchPerformance(filters, rangeFactor);
  const categoryPerformance = getCategoryPerformance(
    scopedEvents,
    branchIds,
    rangeFactor
  );

  return {
    contextLabel:
      filters.branchId === "all"
        ? "All Branches"
        : branches.find((branch) => branch.id === filters.branchId)?.name ??
          "All Branches",
    metrics: {
      fifoLoss: round(fifoLoss),
      fifoDelta: round(deltas.fifo, 1),
      expiryLoss: round(expiryLoss),
      expiryDelta: round(deltas.expiry, 1),
      avoidableLoss: round(avoidableLoss),
      avoidableDelta: round(deltas.avoidable, 1),
      removalCompliance: round(removalCompliance, 1),
      removalDelta: round(deltas.removal, 1),
      actionCompliance: round(actionCompliance, 1),
      actionDelta: round(deltas.action, 1),
      expiryExposure: round(expiryExposure),
      exposureDelta: round(baseMetrics.exposureDelta, 1),
    },
    lossTrend: getLossTrend(
      filters.rangeDays,
      { fifo: fifoLoss, expiry: expiryLoss, avoidable: avoidableLoss },
      deltas,
      hash(`${filters.branchId}-${filters.rangeDays}`) % 10
    ),
    complianceTrend: getComplianceTrend(
      filters.rangeDays,
      { removal: removalCompliance, action: actionCompliance },
      { removal: deltas.removal, action: deltas.action },
      hash(filters.branchId) % 10
    ),
    composition,
    branchPerformance,
    categoryPerformance,
    topDrivers,
    velocityExpiry: getVelocityExpiry(
      scopedEvents,
      branchIds,
      filters.categoryId,
      filters.supplierId,
      rangeFactor
    ),
    insights: getInsights(
      filters.branchId,
      branchPerformance,
      topDrivers,
      categoryPerformance
    ),
  };
}

export const analyticsCategories = categories;
export const analyticsSuppliers = suppliers;
