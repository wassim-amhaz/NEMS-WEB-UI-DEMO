import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  PackageSearch,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  {
    items: [{ label: "Overview", to: "/overview", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { label: "Action Center", to: "/actions", icon: ListTodo },
      { label: "Batches", to: "/batches", icon: Boxes },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Products", to: "/products", icon: PackageSearch },
      { label: "Analytics", to: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Control",
    items: [{ label: "Audits", to: "/audits", icon: ClipboardCheck }],
  },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader className="h-[4.25rem] justify-center border-b border-sidebar-border px-3">
        <Link
          to="/overview"
          className="flex min-w-0 items-center gap-3 rounded-lg px-1 outline-none ring-sidebar-ring focus-visible:ring-2"
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-base font-semibold tracking-tight">
              NEMS
            </span>
            <span className="block truncate text-[0.68rem] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/55">
              Operations intelligence
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-4">
        {navigation.map((group, groupIndex) => (
          <SidebarGroup
            key={group.label ?? "overview"}
            className={groupIndex === 0 ? "pt-0" : "pt-3"}
          >
            {group.label ? (
              <SidebarGroupLabel className="px-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
                {group.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.to;

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="h-10 rounded-lg px-3 text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground"
                      >
                        <Link
                          to={item.to}
                          onClick={() => isMobile && setOpenMobile(false)}
                        >
                          <Icon className="size-[1.05rem]" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/65 px-2.5 py-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar/70">
            <span className="size-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-xs font-medium">Demo workspace</span>
            <span className="block text-[0.68rem] text-sidebar-foreground/50">
              UI foundation ready
            </span>
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}

Sidebar.displayName = "Sidebar";
