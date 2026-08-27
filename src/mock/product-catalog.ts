import {
  DEMO_TODAY,
  batches,
  branches,
  categories,
  fifoLossEvents,
  products,
  suppliers,
  type Category,
  type Product,
  type Supplier,
} from "./nems-data";
import {
  getVelocityBand,
  type VelocityBand,
} from "./operational-helpers";

export type { VelocityBand } from "./operational-helpers";
export type ProductRisk = "high" | "medium" | "low" | "untracked";

export type ProductCatalogRow = {
  product: Product;
  category: Category;
  supplier: Supplier;
  currentStock: number;
  averageDailyVelocity: number;
  velocityBand: VelocityBand;
  activeBatches: number;
  expiryExposure: number;
  fifoLoss: number;
  fifoLossUnits: number;
  risk: ProductRisk;
};

const DAY_MS = 86_400_000;

function daysBetween(date: string, comparison = DEMO_TODAY) {
  return Math.round(
    (new Date(`${date}T12:00:00Z`).getTime() -
      new Date(`${comparison}T12:00:00Z`).getTime()) /
      DAY_MS
  );
}

export function getProductCatalogRows(
  branchId: string = "all"
): ProductCatalogRow[] {
  const scopedBranchIds =
    branchId === "all"
      ? branches.map((branch) => branch.id)
      : branches.some((branch) => branch.id === branchId)
        ? [branchId]
        : branches.map((branch) => branch.id);

  return products
    .filter(
      (product) =>
        branchId === "all" || product.availableBranchIds.includes(branchId)
    )
    .map((product, productIndex) => {
    const productScopeBranchIds = scopedBranchIds.filter((currentBranchId) =>
      product.availableBranchIds.includes(currentBranchId)
    );
    const category = categories.find(
      (item) => item.id === product.categoryId
    )!;
    const supplier = suppliers.find(
      (item) => item.id === product.supplierId
    )!;
    const productBatches = batches.filter(
      (batch) =>
        batch.productId === product.id &&
        batch.status === "active" &&
        productScopeBranchIds.includes(batch.branchId) &&
        product.trackedBranchIds.includes(batch.branchId)
    );

    const currentStock = productScopeBranchIds.reduce((total, currentBranchId) => {
      const branchBatches = productBatches.filter(
        (batch) => batch.branchId === currentBranchId
      );
      if (branchBatches.length > 0) {
        return (
          total +
          branchBatches.reduce(
            (branchTotal, batch) => branchTotal + batch.unitsOnHand,
            0
          )
        );
      }

      return (
        total +
        Math.max(
          6,
          Math.round(
            (product.salesVelocity[currentBranchId] ?? 0) *
              (4 + (productIndex % 4))
          )
        )
      );
    }, 0);

    const averageDailyVelocity =
      productScopeBranchIds.reduce(
        (total, currentBranchId) =>
          total + (product.salesVelocity[currentBranchId] ?? 0),
        0
      ) / Math.max(productScopeBranchIds.length, 1);

    const expiryBatches = productBatches.filter((batch) => {
      const daysToExpiry = daysBetween(batch.expiryDate);
      return daysToExpiry >= -4 && daysToExpiry <= 14;
    });
    const expiryExposure = product.nemsTracked
      ? expiryBatches.reduce(
          (total, batch) => total + batch.unitsOnHand * batch.unitCost,
          0
        )
      : 0;
    const fifoEvents = product.nemsTracked
      ? fifoLossEvents.filter(
          (event) =>
            event.productId === product.id &&
            productScopeBranchIds.includes(event.branchId) &&
            product.trackedBranchIds.includes(event.branchId)
        )
      : [];
    const fifoLoss = fifoEvents.reduce(
      (total, event) => total + event.value,
      0
    );
    const fifoLossUnits = fifoEvents.reduce(
      (total, event) => total + event.units,
      0
    );
    const hasOverdueBatch = productBatches.some(
      (batch) => batch.removalDate < DEMO_TODAY
    );

    return {
      product,
      category,
      supplier,
      currentStock,
      averageDailyVelocity: Number(averageDailyVelocity.toFixed(1)),
      velocityBand: getVelocityBand(averageDailyVelocity),
      activeBatches: product.nemsTracked ? productBatches.length : 0,
      expiryExposure: Number(expiryExposure.toFixed(2)),
      fifoLoss: Number(fifoLoss.toFixed(2)),
      fifoLossUnits,
      risk: !product.nemsTracked
        ? "untracked"
        : hasOverdueBatch || expiryExposure >= 250 || fifoLoss >= 150
          ? "high"
          : expiryExposure >= 80 || fifoLoss >= 50
            ? "medium"
            : "low",
    };
  });
}
