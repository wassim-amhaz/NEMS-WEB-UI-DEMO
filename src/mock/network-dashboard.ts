import { getBranchDashboard, type BranchDashboard } from "./dashboard";
import {
  branches,
  lossEvents,
  products,
  type Branch,
  type Product,
} from "./nems-data";

export type OperationalRisk = "critical" | "high" | "medium" | "healthy";

export type BranchPerformance = {
  branch: Branch;
  dashboard: BranchDashboard;
  fifoLossValue: number;
  risk: OperationalRisk;
  riskScore: number;
  attentionReasons: string[];
};

export type RecurringLossProduct = {
  product: Product;
  branchCount: number;
  eventCount: number;
  units: number;
  fifoValue: number;
  expiryValue: number;
  totalValue: number;
};

export type NetworkDashboard = {
  branchPerformance: BranchPerformance[];
  metrics: {
    trackedProducts: number;
    trackedAssignments: number;
    fifoLoss: number;
    fifoUnits: number;
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
    exposureUnits: number;
    exposureDelta: number;
    openActions: number;
  };
  managementAttention: BranchPerformance[];
  recurringLossProducts: RecurringLossProduct[];
};

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) /
    Math.max(values.length, 1);
}

function weightedAverage(
  items: Array<{ value: number; weight: number }>
) {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  return (
    items.reduce((total, item) => total + item.value * item.weight, 0) /
    Math.max(totalWeight, 1)
  );
}

function getFifoLossValue(dashboard: BranchDashboard) {
  return (
    dashboard.lossBreakdown.find((item) => item.key === "fifo")?.value ?? 0
  );
}

export function getNetworkDashboard(): NetworkDashboard {
  const dashboards = branches.map((branch) => ({
    branch,
    dashboard: getBranchDashboard(branch.id),
  }));
  const averageExpiryLoss = average(
    dashboards.map(({ dashboard }) => dashboard.metrics.expiryLoss)
  );
  const averageExposure = average(
    dashboards.map(({ dashboard }) => dashboard.metrics.expiryExposure)
  );

  const branchPerformance: BranchPerformance[] = dashboards.map(
    ({ branch, dashboard }) => {
      const { metrics } = dashboard;
      const reasons: string[] = [];
      let riskScore = 0;

      if (metrics.removalCompliance < 85) {
        riskScore += 3;
        reasons.push(
          `Removal compliance is ${metrics.removalCompliance.toFixed(1)}%`
        );
      }
      if (metrics.expiryLoss > averageExpiryLoss * 1.2) {
        riskScore += 3;
        reasons.push("Expiry loss is materially above network average");
      }
      if (metrics.expiryDelta > 5) {
        riskScore += 2;
        reasons.push(`Expiry loss is rising ${metrics.expiryDelta.toFixed(1)}%`);
      }
      if (metrics.actionCompliance < 75) {
        riskScore += 3;
        reasons.push(
          `Action compliance is only ${metrics.actionCompliance.toFixed(1)}%`
        );
      }
      if (metrics.expiryExposure > averageExposure * 1.35) {
        riskScore += 2;
        reasons.push("Current expiry exposure is excessive for the network");
      }
      if (metrics.fifoLossRate > 2.05) {
        riskScore += 2;
        reasons.push(`FIFO loss rate is ${metrics.fifoLossRate.toFixed(2)}%`);
      }
      if (reasons.length === 0) {
        reasons.push("Operating within current network thresholds");
      }

      return {
        branch,
        dashboard,
        fifoLossValue: getFifoLossValue(dashboard),
        riskScore,
        risk:
          riskScore >= 7
            ? "critical"
            : riskScore >= 4
              ? "high"
              : riskScore >= 2
                ? "medium"
                : "healthy",
        attentionReasons: reasons,
      };
    }
  );

  const trackedProductIds = new Set(
    products
      .filter((product) => product.trackedBranchIds.length > 0)
      .map((product) => product.id)
  );
  const fifoLoss = branchPerformance.reduce(
    (total, item) => total + item.fifoLossValue,
    0
  );
  const expiryLoss = branchPerformance.reduce(
    (total, item) => total + item.dashboard.metrics.expiryLoss,
    0
  );
  const avoidableLoss = branchPerformance.reduce(
    (total, item) => total + item.dashboard.metrics.avoidableLoss,
    0
  );
  const expiryExposure = branchPerformance.reduce(
    (total, item) => total + item.dashboard.metrics.expiryExposure,
    0
  );

  const recurringProducts = new Map<
    string,
    {
      product: Product;
      branchIds: Set<string>;
      eventCount: number;
      units: number;
      fifoValue: number;
      expiryValue: number;
    }
  >();

  lossEvents
    .filter((event) => event.type === "fifo" || event.type === "expiry")
    .forEach((event) => {
      const product = products.find((item) => item.id === event.productId);
      if (!product?.trackedBranchIds.includes(event.branchId)) return;

      const current = recurringProducts.get(product.id) ?? {
        product,
        branchIds: new Set<string>(),
        eventCount: 0,
        units: 0,
        fifoValue: 0,
        expiryValue: 0,
      };
      current.branchIds.add(event.branchId);
      current.eventCount += 1;
      current.units += event.units;
      if (event.type === "fifo") current.fifoValue += event.value;
      if (event.type === "expiry") current.expiryValue += event.value;
      recurringProducts.set(product.id, current);
    });

  return {
    branchPerformance,
    metrics: {
      trackedProducts: trackedProductIds.size,
      trackedAssignments: branchPerformance.reduce(
        (total, item) => total + item.dashboard.trackedProductCount,
        0
      ),
      fifoLoss,
      fifoUnits: branchPerformance.reduce(
        (total, item) => total + item.dashboard.metrics.fifoUnits,
        0
      ),
      fifoDelta: weightedAverage(
        branchPerformance.map((item) => ({
          value: item.dashboard.metrics.fifoDelta,
          weight: item.fifoLossValue,
        }))
      ),
      expiryLoss,
      expiryDelta: weightedAverage(
        branchPerformance.map((item) => ({
          value: item.dashboard.metrics.expiryDelta,
          weight: item.dashboard.metrics.expiryLoss,
        }))
      ),
      avoidableLoss,
      avoidableDelta: weightedAverage(
        branchPerformance.map((item) => ({
          value: item.dashboard.metrics.avoidableDelta,
          weight: item.dashboard.metrics.avoidableLoss,
        }))
      ),
      removalCompliance: average(
        branchPerformance.map(
          (item) => item.dashboard.metrics.removalCompliance
        )
      ),
      removalDelta: average(
        branchPerformance.map((item) => item.dashboard.metrics.removalDelta)
      ),
      actionCompliance: average(
        branchPerformance.map(
          (item) => item.dashboard.metrics.actionCompliance
        )
      ),
      actionDelta: average(
        branchPerformance.map((item) => item.dashboard.metrics.actionDelta)
      ),
      expiryExposure,
      exposureUnits: branchPerformance.reduce(
        (total, item) => total + item.dashboard.metrics.exposureUnits,
        0
      ),
      exposureDelta: weightedAverage(
        branchPerformance.map((item) => ({
          value: item.dashboard.metrics.exposureDelta,
          weight: item.dashboard.metrics.expiryExposure,
        }))
      ),
      openActions: branchPerformance.reduce(
        (total, item) => total + item.dashboard.openActionCount,
        0
      ),
    },
    managementAttention: [...branchPerformance].sort(
      (a, b) => b.riskScore - a.riskScore
    ),
    recurringLossProducts: [...recurringProducts.values()]
      .filter((item) => item.branchIds.size >= 2)
      .map((item) => ({
        product: item.product,
        branchCount: item.branchIds.size,
        eventCount: item.eventCount,
        units: item.units,
        fifoValue: Number(item.fifoValue.toFixed(2)),
        expiryValue: Number(item.expiryValue.toFixed(2)),
        totalValue: Number((item.fifoValue + item.expiryValue).toFixed(2)),
      }))
      .sort(
        (a, b) =>
          b.totalValue - a.totalValue || b.branchCount - a.branchCount
      )
      .slice(0, 5),
  };
}
