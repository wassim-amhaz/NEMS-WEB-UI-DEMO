import type { PropsWithChildren } from "react";

import { BranchProvider } from "@/components/nems/branch-context";
import { ActionResolutionProvider } from "@/components/nems/action-resolution-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function Layout({ children }: PropsWithChildren) {
  return (
    <BranchProvider>
      <ActionResolutionProvider>
        <SidebarProvider>
          <Sidebar />
          <SidebarInset className="min-w-0 bg-background">
            <Header />
            <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ActionResolutionProvider>
    </BranchProvider>
  );
}

Layout.displayName = "Layout";
