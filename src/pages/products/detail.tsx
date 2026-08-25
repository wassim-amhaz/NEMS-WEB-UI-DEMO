import { ArrowLeft, PackageSearch } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categories, getProduct, suppliers } from "@/mock/nems-data";

export function ProductIntelligencePlaceholder() {
  const { id } = useParams();
  const product = id ? getProduct(id) : undefined;

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const category = categories.find((item) => item.id === product.categoryId);
  const supplier = suppliers.find((item) => item.id === product.supplierId);

  return (
    <section className="mx-auto flex w-full max-w-[96rem] flex-1 flex-col">
      <div className="border-b border-border/70 pb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-1.5 text-muted-foreground">
          <Link to="/products">
            <ArrowLeft className="size-3.5" />
            Back to Master Products
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
              <PackageSearch className="size-4" />
              Product Intelligence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {product.sku} · {product.barcode} · {category?.name} · {supplier?.name}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              product.nemsTracked
                ? "w-fit rounded-md border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "w-fit rounded-md bg-muted text-muted-foreground"
            }
          >
            {product.nemsTracked ? "NEMS tracked" : "Untracked product"}
          </Badge>
        </div>
      </div>

      <Card className="mt-6 flex min-h-[24rem] flex-1 border-dashed bg-card/70 shadow-none">
        <CardContent className="flex w-full items-center justify-center p-6">
          <div className="max-w-md text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm">
              <PackageSearch className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">
              Product Intelligence is next
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The product header and route are ready. Batch intelligence, branch comparison, loss history, and operational actions will be added in the next phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
