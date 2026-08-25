export const DEMO_TODAY = "2026-08-26";

export type Branch = {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string;
  manager: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Supplier = {
  id: string;
  name: string;
  leadTimeDays: number;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  supplierId: string;
  nemsTracked: boolean;
  trackedBranchIds: string[];
  unitCost: number;
  salesVelocity: Record<string, number>;
};

export type Batch = {
  id: string;
  branchId: string;
  productId: string;
  lotNumber: string;
  receivedDate: string;
  expiryDate: string;
  removalDate: string;
  removedAt?: string;
  initialUnits: number;
  unitsOnHand: number;
  unitCost: number;
  status: "active" | "removed";
};

export type LossEventType = "fifo" | "expiry" | "early-removal";

export type LossEvent = {
  id: string;
  branchId: string;
  productId: string;
  batchId?: string;
  type: LossEventType;
  occurredAt: string;
  units: number;
  value: number;
  preventablePercent: number;
};

export type OperationalAction = {
  id: string;
  branchId: string;
  productId?: string;
  batchId?: string;
  title: string;
  type: "remove" | "rotate" | "review" | "transfer";
  priority: "critical" | "high" | "medium";
  dueDate: string;
  status: "open" | "in-progress" | "completed";
  completedAt?: string;
};

export const branches: Branch[] = [
  {
    id: "br-downtown",
    code: "BEY-01",
    name: "Downtown Branch",
    city: "Beirut",
    region: "Central Beirut",
    manager: "Rana Mansour",
  },
  {
    id: "br-north",
    code: "DBY-02",
    name: "North Branch",
    city: "Dbayeh",
    region: "Mount Lebanon",
    manager: "Karim Haddad",
  },
  {
    id: "br-airport",
    code: "BEY-03",
    name: "Airport Branch",
    city: "Choueifat",
    region: "South Beirut",
    manager: "Maya Khoury",
  },
  {
    id: "br-hamra",
    code: "BEY-04",
    name: "Hamra Branch",
    city: "Beirut",
    region: "West Beirut",
    manager: "Omar Nasser",
  },
];

export const categories: Category[] = [
  { id: "cat-dairy", name: "Dairy & Chilled" },
  { id: "cat-produce", name: "Fresh Produce" },
  { id: "cat-meat", name: "Meat & Seafood" },
  { id: "cat-bakery", name: "Bakery" },
  { id: "cat-prepared", name: "Prepared Foods" },
  { id: "cat-beverages", name: "Beverages" },
  { id: "cat-pantry", name: "Pantry" },
  { id: "cat-frozen", name: "Frozen" },
  { id: "cat-household", name: "Household" },
];

export const suppliers: Supplier[] = [
  { id: "sup-cedar-dairy", name: "Cedar Dairy Co.", leadTimeDays: 2 },
  { id: "sup-green-valley", name: "Green Valley Produce", leadTimeDays: 1 },
  { id: "sup-levant-meats", name: "Levant Fresh Meats", leadTimeDays: 2 },
  { id: "sup-blue-harbor", name: "Blue Harbor Seafood", leadTimeDays: 2 },
  { id: "sup-bakers-row", name: "Baker's Row", leadTimeDays: 1 },
  { id: "sup-kitchen-co", name: "Kitchen & Co.", leadTimeDays: 2 },
  { id: "sup-bekaa-juices", name: "Bekaa Juices", leadTimeDays: 3 },
  { id: "sup-union-foods", name: "Union Foods Distribution", leadTimeDays: 4 },
  { id: "sup-cold-chain", name: "Cold Chain Partners", leadTimeDays: 5 },
  { id: "sup-homewise", name: "Homewise Trading", leadTimeDays: 5 },
];

type ProductSeed = Omit<
  Product,
  "id" | "sku" | "salesVelocity" | "trackedBranchIds"
> & {
  baseVelocity: number;
};

const productSeeds: ProductSeed[] = [
  { name: "Whole Milk 1L", categoryId: "cat-dairy", supplierId: "sup-cedar-dairy", nemsTracked: true, unitCost: 1.79, baseVelocity: 18.4 },
  { name: "Greek Yogurt 500g", categoryId: "cat-dairy", supplierId: "sup-cedar-dairy", nemsTracked: true, unitCost: 2.89, baseVelocity: 11.7 },
  { name: "Cheddar Cheese 400g", categoryId: "cat-dairy", supplierId: "sup-cedar-dairy", nemsTracked: true, unitCost: 4.39, baseVelocity: 6.2 },
  { name: "Fresh Cream 250ml", categoryId: "cat-dairy", supplierId: "sup-cedar-dairy", nemsTracked: true, unitCost: 1.99, baseVelocity: 7.9 },
  { name: "Butter 200g", categoryId: "cat-dairy", supplierId: "sup-cedar-dairy", nemsTracked: true, unitCost: 3.49, baseVelocity: 8.1 },
  { name: "Oat Drink 1L", categoryId: "cat-dairy", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 2.69, baseVelocity: 4.8 },
  { name: "Strawberries 250g", categoryId: "cat-produce", supplierId: "sup-green-valley", nemsTracked: true, unitCost: 3.49, baseVelocity: 9.6 },
  { name: "Baby Spinach 200g", categoryId: "cat-produce", supplierId: "sup-green-valley", nemsTracked: true, unitCost: 2.19, baseVelocity: 6.8 },
  { name: "Hass Avocado 4-pack", categoryId: "cat-produce", supplierId: "sup-green-valley", nemsTracked: true, unitCost: 4.99, baseVelocity: 7.2 },
  { name: "Cherry Tomatoes 500g", categoryId: "cat-produce", supplierId: "sup-green-valley", nemsTracked: true, unitCost: 2.79, baseVelocity: 10.4 },
  { name: "Bananas 1kg", categoryId: "cat-produce", supplierId: "sup-green-valley", nemsTracked: true, unitCost: 1.69, baseVelocity: 16.3 },
  { name: "Lemons 1kg", categoryId: "cat-produce", supplierId: "sup-green-valley", nemsTracked: false, unitCost: 2.49, baseVelocity: 5.7 },
  { name: "Chicken Breast Fillets", categoryId: "cat-meat", supplierId: "sup-levant-meats", nemsTracked: true, unitCost: 6.49, baseVelocity: 12.1 },
  { name: "Lean Beef Mince 500g", categoryId: "cat-meat", supplierId: "sup-levant-meats", nemsTracked: true, unitCost: 7.19, baseVelocity: 9.3 },
  { name: "Atlantic Salmon Fillet", categoryId: "cat-meat", supplierId: "sup-blue-harbor", nemsTracked: true, unitCost: 11.49, baseVelocity: 5.2 },
  { name: "Deli Turkey Slices", categoryId: "cat-meat", supplierId: "sup-levant-meats", nemsTracked: true, unitCost: 4.79, baseVelocity: 7.6 },
  { name: "Lamb Chops 500g", categoryId: "cat-meat", supplierId: "sup-levant-meats", nemsTracked: true, unitCost: 10.89, baseVelocity: 3.9 },
  { name: "Frozen Chicken Nuggets", categoryId: "cat-frozen", supplierId: "sup-cold-chain", nemsTracked: false, unitCost: 5.29, baseVelocity: 6.7 },
  { name: "Whole Wheat Bread", categoryId: "cat-bakery", supplierId: "sup-bakers-row", nemsTracked: true, unitCost: 2.29, baseVelocity: 14.8 },
  { name: "Butter Croissant 4-pack", categoryId: "cat-bakery", supplierId: "sup-bakers-row", nemsTracked: true, unitCost: 3.59, baseVelocity: 8.7 },
  { name: "Pita Bread 6-pack", categoryId: "cat-bakery", supplierId: "sup-bakers-row", nemsTracked: true, unitCost: 1.49, baseVelocity: 17.1 },
  { name: "Blueberry Muffins 4-pack", categoryId: "cat-bakery", supplierId: "sup-bakers-row", nemsTracked: true, unitCost: 3.89, baseVelocity: 5.8 },
  { name: "Brioche Burger Buns", categoryId: "cat-bakery", supplierId: "sup-bakers-row", nemsTracked: true, unitCost: 2.99, baseVelocity: 7.4 },
  { name: "Sea Salt Crackers", categoryId: "cat-pantry", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 1.89, baseVelocity: 4.6 },
  { name: "Classic Hummus 250g", categoryId: "cat-prepared", supplierId: "sup-kitchen-co", nemsTracked: true, unitCost: 2.49, baseVelocity: 13.2 },
  { name: "Caesar Salad Bowl", categoryId: "cat-prepared", supplierId: "sup-kitchen-co", nemsTracked: true, unitCost: 5.19, baseVelocity: 7.1 },
  { name: "Grilled Chicken Wrap", categoryId: "cat-prepared", supplierId: "sup-kitchen-co", nemsTracked: true, unitCost: 4.89, baseVelocity: 9.9 },
  { name: "Fresh Spinach Ravioli", categoryId: "cat-prepared", supplierId: "sup-kitchen-co", nemsTracked: true, unitCost: 4.29, baseVelocity: 5.4 },
  { name: "Beef Lasagna Ready Meal", categoryId: "cat-prepared", supplierId: "sup-kitchen-co", nemsTracked: true, unitCost: 7.49, baseVelocity: 4.7 },
  { name: "Canned Red Kidney Beans", categoryId: "cat-pantry", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 1.29, baseVelocity: 5.1 },
  { name: "Fresh Orange Juice 1L", categoryId: "cat-beverages", supplierId: "sup-bekaa-juices", nemsTracked: true, unitCost: 3.39, baseVelocity: 10.8 },
  { name: "Cold Brew Coffee 250ml", categoryId: "cat-beverages", supplierId: "sup-bekaa-juices", nemsTracked: true, unitCost: 2.99, baseVelocity: 6.6 },
  { name: "Sparkling Water 6-pack", categoryId: "cat-beverages", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 3.19, baseVelocity: 8.2 },
  { name: "Cola Zero 6-pack", categoryId: "cat-beverages", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 4.29, baseVelocity: 9.4 },
  { name: "Apple Juice 1L", categoryId: "cat-beverages", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 2.19, baseVelocity: 7.7 },
  { name: "Energy Drink 250ml", categoryId: "cat-beverages", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 1.89, baseVelocity: 6.9 },
  { name: "Free Range Eggs 12-pack", categoryId: "cat-dairy", supplierId: "sup-cedar-dairy", nemsTracked: true, unitCost: 4.59, baseVelocity: 12.6 },
  { name: "Mayonnaise 500ml", categoryId: "cat-pantry", supplierId: "sup-union-foods", nemsTracked: true, unitCost: 3.29, baseVelocity: 4.2 },
  { name: "Tomato Pasta Sauce", categoryId: "cat-pantry", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 2.39, baseVelocity: 5.6 },
  { name: "Basmati Rice 1kg", categoryId: "cat-pantry", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 3.69, baseVelocity: 7.3 },
  { name: "Extra Virgin Olive Oil", categoryId: "cat-pantry", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 8.99, baseVelocity: 3.8 },
  { name: "Honey Oat Cereal", categoryId: "cat-pantry", supplierId: "sup-union-foods", nemsTracked: false, unitCost: 4.19, baseVelocity: 4.9 },
  { name: "Vanilla Ice Cream 1L", categoryId: "cat-frozen", supplierId: "sup-cold-chain", nemsTracked: false, unitCost: 5.49, baseVelocity: 5.8 },
  { name: "Frozen Mixed Berries", categoryId: "cat-frozen", supplierId: "sup-cold-chain", nemsTracked: true, unitCost: 6.29, baseVelocity: 4.1 },
  { name: "Margherita Frozen Pizza", categoryId: "cat-frozen", supplierId: "sup-cold-chain", nemsTracked: false, unitCost: 4.89, baseVelocity: 6.2 },
  { name: "Dishwashing Liquid", categoryId: "cat-household", supplierId: "sup-homewise", nemsTracked: false, unitCost: 2.79, baseVelocity: 4.3 },
  { name: "Paper Towels 6-pack", categoryId: "cat-household", supplierId: "sup-homewise", nemsTracked: false, unitCost: 5.19, baseVelocity: 5.4 },
  { name: "Drawstring Trash Bags", categoryId: "cat-household", supplierId: "sup-homewise", nemsTracked: false, unitCost: 3.99, baseVelocity: 3.7 },
];

const branchVelocityFactors = [1, 0.82, 0.68, 0.9];

const branchTrackingExclusions: Record<string, Set<number>> = {
  "br-downtown": new Set(),
  "br-north": new Set([5, 23, 38]),
  "br-airport": new Set([3, 4, 5, 17, 22, 23, 28, 32]),
  "br-hamra": new Set([4, 32]),
};

export const products: Product[] = productSeeds.map((seed, productIndex) => ({
  id: `prd-${String(productIndex + 1).padStart(3, "0")}`,
  sku: `NMS-${String(1001 + productIndex)}`,
  name: seed.name,
  categoryId: seed.categoryId,
  supplierId: seed.supplierId,
  nemsTracked: seed.nemsTracked,
  trackedBranchIds: seed.nemsTracked
    ? branches
        .filter(
          (branch) =>
            !branchTrackingExclusions[branch.id].has(productIndex + 1)
        )
        .map((branch) => branch.id)
    : [],
  unitCost: seed.unitCost,
  salesVelocity: Object.fromEntries(
    branches.map((branch, branchIndex) => [
      branch.id,
      Number(
        (
          seed.baseVelocity *
          branchVelocityFactors[branchIndex] *
          (0.93 + ((productIndex + branchIndex * 2) % 8) * 0.02)
        ).toFixed(1)
      ),
    ])
  ),
}));

const DAY_MS = 86_400_000;

function shiftDate(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

const attentionOffsetsByBranch: Record<string, number[]> = {
  "br-downtown": [-5, -3, -2, -1, 0, 0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37],
  "br-north": [-4, -2, -1, 0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30, 34],
  "br-airport": [0, 1, 2, 4, 5, 6, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55],
  "br-hamra": [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44],
};

const exposureStockFactors: Record<string, number> = {
  "br-downtown": 1.12,
  "br-north": 1.02,
  "br-airport": 0.68,
  "br-hamra": 1.72,
};

function getTrackedProductsForBranch(branchId: string) {
  return products.filter((product) => product.trackedBranchIds.includes(branchId));
}

export const batches: Batch[] = branches.flatMap((branch, branchIndex) =>
  getTrackedProductsForBranch(branch.id).flatMap((product, productIndex) => {
    const offsets = attentionOffsetsByBranch[branch.id];
    const offset = offsets[productIndex % offsets.length];
    const removalDate = shiftDate(DEMO_TODAY, offset);
    const velocity = product.salesVelocity[branch.id];
    const initialUnits = Math.max(18, Math.round(velocity * (8 + (productIndex % 5))));
    const unitsOnHand = Math.max(
      4,
      Math.round(
        velocity *
          (2.2 + (productIndex % 4) * 0.65) *
          exposureStockFactors[branch.id]
      )
    );
    const activeBatch: Batch = {
      id: `bat-${branchIndex + 1}-${String(productIndex + 1).padStart(2, "0")}-a`,
      branchId: branch.id,
      productId: product.id,
      lotNumber: `L${260700 + branchIndex * 100 + productIndex}`,
      receivedDate: shiftDate(removalDate, -11 - (productIndex % 7)),
      expiryDate: shiftDate(removalDate, 3 + (productIndex % 3)),
      removalDate,
      initialUnits,
      unitsOnHand,
      unitCost: product.unitCost,
      status: "active",
    };

    if (productIndex % 2 !== 0) {
      return [activeBatch];
    }

    const historicRemovalDate = shiftDate(DEMO_TODAY, -11 - (productIndex % 15));
    const removalDelay =
      branch.id === "br-downtown"
        ? productIndex % 5 === 0
          ? 2
          : -1
        : branch.id === "br-north"
          ? productIndex % 7 === 0
            ? 1
            : -1
          : -1;
    const historicBatch: Batch = {
      id: `bat-${branchIndex + 1}-${String(productIndex + 1).padStart(2, "0")}-h`,
      branchId: branch.id,
      productId: product.id,
      lotNumber: `L${260500 + branchIndex * 100 + productIndex}`,
      receivedDate: shiftDate(historicRemovalDate, -14),
      expiryDate: shiftDate(historicRemovalDate, 3),
      removalDate: historicRemovalDate,
      removedAt: shiftDate(historicRemovalDate, removalDelay),
      initialUnits: Math.round(initialUnits * 0.9),
      unitsOnHand: 0,
      unitCost: product.unitCost,
      status: "removed",
    };

    return [activeBatch, historicBatch];
  })
);

type LossSeed = {
  productId: string;
  units: number;
  events: number;
  preventablePercent: number;
};

const branchLossProfiles: Record<
  string,
  Record<LossEventType, LossSeed[]>
> = {
  "br-downtown": {
    fifo: [
      { productId: "prd-013", units: 46, events: 4, preventablePercent: 1 },
      { productId: "prd-016", units: 27, events: 3, preventablePercent: 1 },
      { productId: "prd-007", units: 32, events: 3, preventablePercent: 1 },
      { productId: "prd-002", units: 38, events: 3, preventablePercent: 1 },
      { productId: "prd-009", units: 21, events: 2, preventablePercent: 1 },
      { productId: "prd-019", units: 23, events: 2, preventablePercent: 1 },
    ],
    expiry: [
      { productId: "prd-015", units: 55, events: 5, preventablePercent: 0.45 },
      { productId: "prd-029", units: 46, events: 4, preventablePercent: 0.52 },
      { productId: "prd-009", units: 62, events: 5, preventablePercent: 0.5 },
      { productId: "prd-013", units: 40, events: 4, preventablePercent: 0.4 },
      { productId: "prd-025", units: 75, events: 5, preventablePercent: 0.42 },
      { productId: "prd-007", units: 44, events: 4, preventablePercent: 0.47 },
      { productId: "prd-002", units: 55, events: 4, preventablePercent: 0.38 },
    ],
    "early-removal": [
      { productId: "prd-017", units: 24, events: 3, preventablePercent: 0.9 },
      { productId: "prd-015", units: 20, events: 2, preventablePercent: 0.9 },
      { productId: "prd-029", units: 18, events: 2, preventablePercent: 0.9 },
      { productId: "prd-026", units: 25, events: 3, preventablePercent: 0.9 },
    ],
  },
  "br-north": {
    fifo: [
      { productId: "prd-016", units: 26, events: 4, preventablePercent: 1 },
      { productId: "prd-009", units: 22, events: 3, preventablePercent: 1 },
      { productId: "prd-002", units: 28, events: 3, preventablePercent: 1 },
      { productId: "prd-019", units: 21, events: 3, preventablePercent: 1 },
      { productId: "prd-025", units: 18, events: 2, preventablePercent: 1 },
    ],
    expiry: [
      { productId: "prd-029", units: 48, events: 5, preventablePercent: 0.55 },
      { productId: "prd-028", units: 70, events: 6, preventablePercent: 0.5 },
      { productId: "prd-025", units: 105, events: 6, preventablePercent: 0.48 },
      { productId: "prd-002", units: 88, events: 6, preventablePercent: 0.42 },
      { productId: "prd-009", units: 48, events: 5, preventablePercent: 0.52 },
      { productId: "prd-015", units: 20, events: 4, preventablePercent: 0.45 },
    ],
    "early-removal": [
      { productId: "prd-017", units: 20, events: 3, preventablePercent: 0.9 },
      { productId: "prd-014", units: 24, events: 3, preventablePercent: 0.9 },
      { productId: "prd-029", units: 18, events: 2, preventablePercent: 0.9 },
      { productId: "prd-026", units: 27, events: 3, preventablePercent: 0.9 },
    ],
  },
  "br-airport": {
    fifo: [
      { productId: "prd-027", units: 6, events: 2, preventablePercent: 1 },
      { productId: "prd-031", units: 6, events: 2, preventablePercent: 1 },
      { productId: "prd-019", units: 8, events: 2, preventablePercent: 1 },
      { productId: "prd-011", units: 10, events: 2, preventablePercent: 1 },
      { productId: "prd-025", units: 6, events: 1, preventablePercent: 1 },
    ],
    expiry: [
      { productId: "prd-015", units: 8, events: 2, preventablePercent: 0.42 },
      { productId: "prd-026", units: 12, events: 2, preventablePercent: 0.45 },
      { productId: "prd-009", units: 10, events: 2, preventablePercent: 0.48 },
      { productId: "prd-013", units: 7, events: 1, preventablePercent: 0.38 },
      { productId: "prd-002", units: 12, events: 2, preventablePercent: 0.35 },
    ],
    "early-removal": [
      { productId: "prd-015", units: 5, events: 1, preventablePercent: 0.9 },
      { productId: "prd-014", units: 6, events: 1, preventablePercent: 0.9 },
      { productId: "prd-026", units: 7, events: 1, preventablePercent: 0.9 },
    ],
  },
  "br-hamra": {
    fifo: [
      { productId: "prd-031", units: 22, events: 3, preventablePercent: 1 },
      { productId: "prd-019", units: 28, events: 3, preventablePercent: 1 },
      { productId: "prd-037", units: 12, events: 2, preventablePercent: 1 },
      { productId: "prd-013", units: 8, events: 2, preventablePercent: 1 },
      { productId: "prd-025", units: 19, events: 2, preventablePercent: 1 },
    ],
    expiry: [
      { productId: "prd-028", units: 36, events: 4, preventablePercent: 0.48 },
      { productId: "prd-026", units: 27, events: 3, preventablePercent: 0.43 },
      { productId: "prd-017", units: 12, events: 2, preventablePercent: 0.4 },
      { productId: "prd-031", units: 34, events: 3, preventablePercent: 0.42 },
      { productId: "prd-020", units: 30, events: 3, preventablePercent: 0.45 },
      { productId: "prd-007", units: 28, events: 3, preventablePercent: 0.44 },
    ],
    "early-removal": [
      { productId: "prd-017", units: 9, events: 1, preventablePercent: 0.9 },
      { productId: "prd-014", units: 10, events: 2, preventablePercent: 0.9 },
      { productId: "prd-026", units: 12, events: 2, preventablePercent: 0.9 },
    ],
  },
};

function createLossEvents(type: LossEventType) {
  return branches.flatMap((branch, branchIndex) =>
    branchLossProfiles[branch.id][type].flatMap((seed, seedIndex) => {
      const product = products.find((item) => item.id === seed.productId)!;
      if (!product.trackedBranchIds.includes(branch.id)) return [];
      const baseUnits = Math.floor(seed.units / seed.events);
      let allocatedUnits = 0;

      return Array.from({ length: seed.events }, (_, eventIndex) => {
        const units =
          eventIndex === seed.events - 1
            ? seed.units - allocatedUnits
            : baseUnits + ((seedIndex + eventIndex) % 2);
        allocatedUnits += units;

        return {
          id: `${type}-${branchIndex + 1}-${seedIndex + 1}-${eventIndex + 1}`,
          branchId: branch.id,
          productId: seed.productId,
          type,
          occurredAt: shiftDate(DEMO_TODAY, -2 - ((seedIndex * 4 + eventIndex * 6 + branchIndex) % 27)),
          units,
          value: Number((units * product.unitCost).toFixed(2)),
          preventablePercent: seed.preventablePercent,
        } satisfies LossEvent;
      });
    })
  );
}

export const fifoLossEvents = createLossEvents("fifo");
export const expiryLossEvents = createLossEvents("expiry");
export const earlyRemovalLossEvents = createLossEvents("early-removal");
export const lossEvents = [
  ...fifoLossEvents,
  ...expiryLossEvents,
  ...earlyRemovalLossEvents,
];

const actionTitles: OperationalAction["type"][] = [
  "remove",
  "rotate",
  "review",
  "transfer",
];

const openActionTargets: Record<string, number> = {
  "br-downtown": 12,
  "br-north": 11,
  "br-airport": 5,
  "br-hamra": 6,
};

const openOperationalActions: OperationalAction[] = branches.flatMap(
  (branch, branchIndex) => {
    const branchBatches = batches
      .filter((batch) => batch.branchId === branch.id && batch.status === "active")
      .filter((batch) => batch.removalDate <= shiftDate(DEMO_TODAY, 7))
      .slice(0, openActionTargets[branch.id]);

    return branchBatches.map((batch, actionIndex) => {
      const product = products.find((item) => item.id === batch.productId)!;
      const type = actionTitles[(actionIndex + branchIndex) % actionTitles.length];

      return {
        id: `act-open-${branchIndex + 1}-${actionIndex + 1}`,
        branchId: branch.id,
        productId: product.id,
        batchId: batch.id,
        title:
          type === "remove"
            ? `Remove ${product.name}`
            : type === "rotate"
              ? `Correct shelf rotation for ${product.name}`
              : type === "transfer"
                ? `Review transfer for ${product.name}`
                : `Review excess stock for ${product.name}`,
        type,
        priority:
          batch.removalDate < DEMO_TODAY
            ? "critical"
            : batch.removalDate === DEMO_TODAY
              ? "high"
              : "medium",
        dueDate: batch.removalDate,
        status: actionIndex % 4 === 1 ? "in-progress" : "open",
      } satisfies OperationalAction;
    });
  }
);

const completedOperationalActions: OperationalAction[] = branches.flatMap(
  (branch, branchIndex) => {
    const branchTrackedProducts = getTrackedProductsForBranch(branch.id);

    return Array.from({ length: 22 }, (_, actionIndex) => {
      const product =
        branchTrackedProducts[
          (actionIndex * 3 + branchIndex) % branchTrackedProducts.length
        ];
      const dueDate = shiftDate(DEMO_TODAY, -3 - actionIndex);
      const late =
        branch.id === "br-downtown"
          ? [0, 8, 16].includes(actionIndex)
          : branch.id === "br-north"
            ? [1, 7, 15].includes(actionIndex)
            : branch.id === "br-airport"
              ? actionIndex % 3 === 0
              : actionIndex === 11;

      return {
        id: `act-done-${branchIndex + 1}-${actionIndex + 1}`,
        branchId: branch.id,
        productId: product.id,
        title: `Completed stock control for ${product.name}`,
        type: actionTitles[(actionIndex + 1) % actionTitles.length],
        priority: actionIndex % 6 === 0 ? "high" : "medium",
        dueDate,
        status: "completed",
        completedAt: shiftDate(dueDate, late ? 1 : -1),
      } satisfies OperationalAction;
    });
  }
);

export const operationalActions = [
  ...openOperationalActions,
  ...completedOperationalActions,
];

export const openActions = operationalActions.filter(
  (action) => action.status !== "completed"
);

export function getProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

export function getBranch(branchId: string) {
  return branches.find((branch) => branch.id === branchId);
}

export function getCategory(categoryId: string) {
  return categories.find((category) => category.id === categoryId);
}
