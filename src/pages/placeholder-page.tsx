import type { LucideIcon } from "lucide-react";
import { ArrowRight, Construction } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PlaceholderPageProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderPage({
  icon: Icon,
  eyebrow,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-[96rem] flex-1 flex-col">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
            <Icon className="size-4" />
            {eyebrow}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
            {description}
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit gap-1.5 rounded-md border-primary/20 bg-primary/5 px-2.5 py-1 text-primary"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          Shell ready
        </Badge>
      </div>

      <Card className="mt-6 flex min-h-[24rem] flex-1 border-dashed bg-card/70 shadow-none">
        <CardContent className="flex w-full items-center justify-center p-6">
          <div className="max-w-md text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm">
              <Construction className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">
              Ready for the next build phase
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This workspace is intentionally empty. Data views, filters,
              metrics, and operational workflows will be added in a later phase.
            </p>
            <Button variant="ghost" size="sm" disabled className="mt-4 gap-1.5">
              Module preview
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
