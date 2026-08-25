import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Eye,
  MoreHorizontal,
  Package,
  Radar,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useNavigate } from "react-router";

import { ALL_BRANCHES_ID, useBranch } from "@/components/nems/branch-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getProductCatalogRows,
  type ProductCatalogRow,
  type ProductRisk,
  type VelocityBand,
} from "@/mock/product-catalog";
import {
  branches,
  categories,
  suppliers,
  type Product,
} from "@/mock/nems-data";

type TrackingFilter = "all" | "tracked" | "untracked";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US");

export function MasterProductsPage() {
  const navigate = useNavigate();
  const { selectedBranchId } = useBranch();
  const [search, setSearch] = useState("");
  const [trackingFilter, setTrackingFilter] =
    useState<TrackingFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [velocityFilter, setVelocityFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState(selectedBranchId);
  const [trackingOverrides, setTrackingOverrides] = useState<
    Record<string, boolean>
  >({});
  const [removeBeforeOverrides, setRemoveBeforeOverrides] = useState<
    Record<string, number>
  >({});
  const [trackingProduct, setTrackingProduct] = useState<Product | null>(null);
  const [pendingTracking, setPendingTracking] = useState(true);
  const [pendingDays, setPendingDays] = useState(3);

  useEffect(() => {
    setBranchFilter(selectedBranchId);
  }, [selectedBranchId]);

  const catalogRows = useMemo(
    () => getProductCatalogRows(branchFilter),
    [branchFilter]
  );

  const isTracked = (product: Product) =>
    trackingOverrides[product.id] ?? product.nemsTracked;
  const getRemoveBeforeDays = (product: Product) =>
    removeBeforeOverrides[product.id] ?? product.removeBeforeDays;
  const getEffectiveRisk = (row: ProductCatalogRow): ProductRisk =>
    isTracked(row.product)
      ? row.product.nemsTracked
        ? row.risk
        : "low"
      : "untracked";

  const filteredRows = catalogRows.filter((row) => {
    const normalizedSearch = search.trim().toLowerCase();
    const tracked = isTracked(row.product);
    const risk = getEffectiveRisk(row);

    return (
      (!normalizedSearch ||
        row.product.name.toLowerCase().includes(normalizedSearch) ||
        row.product.id.toLowerCase().includes(normalizedSearch) ||
        row.product.sku.toLowerCase().includes(normalizedSearch) ||
        row.product.barcode.includes(normalizedSearch)) &&
      (trackingFilter === "all" ||
        (trackingFilter === "tracked" && tracked) ||
        (trackingFilter === "untracked" && !tracked)) &&
      (categoryFilter === "all" ||
        row.product.categoryId === categoryFilter) &&
      (supplierFilter === "all" ||
        row.product.supplierId === supplierFilter) &&
      (velocityFilter === "all" || row.velocityBand === velocityFilter) &&
      (riskFilter === "all" || risk === riskFilter)
    );
  });

  const trackedCount = catalogRows.filter((row) => isTracked(row.product)).length;
  const totalCount = catalogRows.length;
  const untrackedCount = totalCount - trackedCount;
  const highRiskCount = catalogRows.filter(
    (row) => isTracked(row.product) && getEffectiveRisk(row) === "high"
  ).length;
  const scopeLabel =
    branchFilter === ALL_BRANCHES_ID
      ? "All Branches"
      : branches.find((branch) => branch.id === branchFilter)?.name ??
        "All Branches";
  const hasFilters =
    search ||
    trackingFilter !== "all" ||
    categoryFilter !== "all" ||
    supplierFilter !== "all" ||
    velocityFilter !== "all" ||
    riskFilter !== "all" ||
    branchFilter !== selectedBranchId;

  const clearFilters = () => {
    setSearch("");
    setTrackingFilter("all");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setVelocityFilter("all");
    setRiskFilter("all");
    setBranchFilter(selectedBranchId);
  };

  const openTrackingDialog = (product: Product) => {
    const currentlyTracked = isTracked(product);
    setTrackingProduct(product);
    setPendingTracking(!currentlyTracked);
    setPendingDays(getRemoveBeforeDays(product) ?? 3);
  };

  const applyTrackingChange = () => {
    if (!trackingProduct) return;
    setTrackingOverrides((current) => ({
      ...current,
      [trackingProduct.id]: pendingTracking,
    }));
    if (pendingTracking) {
      setRemoveBeforeOverrides((current) => ({
        ...current,
        [trackingProduct.id]: Math.max(1, Math.min(30, pendingDays || 1)),
      }));
    }
    setTrackingProduct(null);
  };

  return (
    <section className="mx-auto w-full max-w-[96rem] space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
            <Package className="size-4" />
            Master Data
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Master Products
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
            The complete product universe, with clear visibility into which products contribute to NEMS operational intelligence.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit rounded-md border-primary/20 bg-primary/5 px-2.5 py-1 text-primary"
        >
          {scopeLabel} · {totalCount} products
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CatalogStat
          label="Total Products"
          value={totalCount}
          detail="Complete master catalog"
          icon={Boxes}
        />
        <CatalogStat
          label="Tracked Products"
          value={trackedCount}
          detail="Included in NEMS intelligence"
          icon={ShieldCheck}
          tone="success"
        />
        <CatalogStat
          label="Untracked Products"
          value={untrackedCount}
          detail="Visible in catalog only"
          icon={ShieldOff}
          tone="muted"
        />
        <CatalogStat
          label="High-Risk Tracked"
          value={highRiskCount}
          detail={`Based on ${scopeLabel.toLowerCase()} exposure`}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_repeat(3,minmax(10rem,0.45fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, SKU, product ID, or barcode..."
                className="pl-9"
                aria-label="Search products"
              />
            </div>
            <FilterSelect
              value={trackingFilter}
              onValueChange={(value) =>
                setTrackingFilter(value as TrackingFilter)
              }
              placeholder="Tracking"
              items={[
                { value: "all", label: "All tracking states" },
                { value: "tracked", label: "Tracked" },
                { value: "untracked", label: "Untracked" },
              ]}
            />
            <FilterSelect
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              placeholder="Category"
              items={[
                { value: "all", label: "All categories" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
            <FilterSelect
              value={supplierFilter}
              onValueChange={setSupplierFilter}
              placeholder="Supplier"
              items={[
                { value: "all", label: "All suppliers" },
                ...suppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.name,
                })),
              ]}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(10rem,0.45fr))_1fr]">
            <FilterSelect
              value={velocityFilter}
              onValueChange={setVelocityFilter}
              placeholder="Velocity"
              items={[
                { value: "all", label: "All velocities" },
                { value: "high", label: "High velocity" },
                { value: "medium", label: "Medium velocity" },
                { value: "low", label: "Low velocity" },
              ]}
            />
            <FilterSelect
              value={riskFilter}
              onValueChange={setRiskFilter}
              placeholder="Risk"
              items={[
                { value: "all", label: "All risk levels" },
                { value: "high", label: "High risk" },
                { value: "medium", label: "Medium risk" },
                { value: "low", label: "Low risk" },
                { value: "untracked", label: "Not assessed" },
              ]}
            />
            <FilterSelect
              value={branchFilter}
              onValueChange={setBranchFilter}
              placeholder="Branch"
              items={[
                { value: ALL_BRANCHES_ID, label: "All Branches" },
                ...branches.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ]}
            />
            <div className="flex items-center justify-end">
              {hasFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={clearFilters}
                >
                  <RotateCcw className="size-3.5" />
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 border-border/75 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Product Catalog</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredRows.length} of {totalCount} products · {scopeLabel} operating values
            </p>
          </div>
          <Badge variant="secondary" className="rounded-md">
            Tracked only drives NEMS metrics
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow className="bg-muted/35 hover:bg-muted/35">
                <TableHead className="pl-5">Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Velocity</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Remove Before</TableHead>
                <TableHead className="text-right">Batches / Exposure</TableHead>
                <TableHead className="text-right">FIFO Loss</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => {
                const tracked = isTracked(row.product);
                const risk = getEffectiveRisk(row);
                const removeBeforeDays = getRemoveBeforeDays(row.product);

                return (
                  <TableRow
                    key={row.product.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                    onClick={() => navigate(`/products/${row.product.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        navigate(`/products/${row.product.id}`);
                      }
                    }}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Package className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[14rem] truncate text-xs font-semibold">
                            {row.product.name}
                          </p>
                          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                            {row.product.sku} · {row.product.barcode}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{row.category.name}</TableCell>
                    <TableCell className="max-w-[11rem] truncate text-xs text-muted-foreground">
                      {row.supplier.name}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium tabular-nums">
                      {number.format(row.currentStock)}
                    </TableCell>
                    <TableCell>
                      <VelocityBadge
                        band={row.velocityBand}
                        value={row.averageDailyVelocity}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrackingBadge tracked={tracked} />
                        {tracked ? <RiskBadge risk={risk} /> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {tracked && removeBeforeDays
                        ? `${removeBeforeDays} days`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {tracked ? (
                        <div>
                          <p className="text-xs font-medium tabular-nums">
                            {row.activeBatches} active · {currency.format(row.expiryExposure)}
                          </p>
                          <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                            expiry exposure
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not monitored</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {tracked ? (
                        <div>
                          <p className="text-xs font-medium tabular-nums">
                            {currency.format(row.fifoLoss)}
                          </p>
                          <p className="mt-0.5 text-[0.64rem] text-muted-foreground">
                            {row.fifoLossUnits} units
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${row.product.name}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onSelect={() =>
                              navigate(`/products/${row.product.id}`)
                            }
                          >
                            <Eye /> View product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => openTrackingDialog(row.product)}
                            className={cn(
                              tracked && "text-destructive focus:text-destructive"
                            )}
                          >
                            {tracked ? <ShieldOff /> : <Radar />}
                            {tracked ? "Stop tracking" : "Track with NEMS"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center">
                    <p className="text-sm font-medium">No matching products</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Adjust the search or clear one of the filters.
                    </p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(trackingProduct)}
        onOpenChange={(open) => !open && setTrackingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingTracking ? "Track with NEMS" : "Stop NEMS tracking"}
            </DialogTitle>
            <DialogDescription>
              {pendingTracking
                ? `${trackingProduct?.name ?? "This product"} will begin contributing to future FIFO, expiry, loss, and compliance intelligence.`
                : `${trackingProduct?.name ?? "This product"} will remain in the master catalog but will no longer appear as NEMS tracked.`}
            </DialogDescription>
          </DialogHeader>
          {pendingTracking ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <Label htmlFor="remove-before-days">Remove Before value</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id="remove-before-days"
                  type="number"
                  min={1}
                  max={30}
                  value={pendingDays}
                  onChange={(event) => setPendingDays(Number(event.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  days before expiry
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                NEMS will use this lead time to schedule removal attention for the product.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingProduct(null)}>
              Cancel
            </Button>
            <Button
              variant={pendingTracking ? "default" : "destructive"}
              onClick={applyTrackingChange}
            >
              {pendingTracking ? "Start tracking" : "Stop tracking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type CatalogStatProps = {
  label: string;
  value: number;
  detail: string;
  icon: typeof Package;
  tone?: "default" | "success" | "warning" | "muted";
};

const statTones = {
  default: "bg-primary/8 text-primary",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  muted: "bg-muted text-muted-foreground",
};

function CatalogStat({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: CatalogStatProps) {
  return (
    <Card className="gap-0 border-border/75 py-0 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", statTones[tone])}>
          <Icon className="size-[1.1rem]" />
        </span>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type FilterSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: Array<{ value: string; label: string }>;
};

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  items,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full bg-background" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TrackingBadge({ tracked }: { tracked: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[0.64rem] font-semibold",
        tracked
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-border bg-muted/70 text-muted-foreground"
      )}
    >
      {tracked ? "Tracked" : "Untracked"}
    </Badge>
  );
}

function VelocityBadge({
  band,
  value,
}: {
  band: VelocityBand;
  value: number;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[0.64rem] font-semibold capitalize",
        band === "high"
          ? "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400"
          : band === "medium"
            ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400"
            : "border-border bg-muted/70 text-muted-foreground"
      )}
    >
      {band} · {value.toFixed(1)}/day
    </Badge>
  );
}

function RiskBadge({ risk }: { risk: ProductRisk }) {
  if (risk === "untracked") return null;
  return (
    <span
      className={cn(
        "size-2 rounded-full",
        risk === "high"
          ? "bg-red-500"
          : risk === "medium"
            ? "bg-amber-500"
            : "bg-emerald-500"
      )}
      title={`${risk} operational risk`}
      aria-label={`${risk} operational risk`}
    />
  );
}
