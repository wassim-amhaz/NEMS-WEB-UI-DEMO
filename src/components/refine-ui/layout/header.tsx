import {
  Bell,
  CalendarDays,
  ChevronDown,
  Search,
} from "lucide-react";

import {
  ALL_BRANCHES_ID,
  useBranch,
} from "@/components/nems/branch-context";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { branches } from "@/mock/nems-data";

export const Header = () => {
  const { selectedBranchId, setSelectedBranchId } = useBranch();

  return (
    <header className="sticky top-0 z-40 flex h-[4.25rem] shrink-0 items-center gap-2 border-b border-border/80 bg-card/95 px-3 backdrop-blur sm:gap-3 sm:px-5">
      <SidebarTrigger className="size-9 shrink-0 text-muted-foreground" />

      <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
        <SelectTrigger
          aria-label="Select branch"
          className="h-9 w-[9.25rem] border-border/80 bg-background shadow-none sm:w-[11rem]"
        >
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_BRANCHES_ID}>All Branches</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative hidden max-w-xl flex-1 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search is available within each workspace"
        placeholder="Use page search and filters..."
        readOnly
        tabIndex={-1}
        className="h-9 cursor-default border-border/80 bg-background pl-9 shadow-none"
      />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
      <div
        aria-label="Default reporting period: Last 30 days"
        className="hidden h-9 items-center gap-2 rounded-md border border-border/80 bg-background px-3 text-sm font-normal lg:flex"
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span>Last 30 days</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9"
            aria-label="Notifications"
          >
            <Bell className="size-[1.1rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-3 py-5 text-center text-sm text-muted-foreground">
            No new operational notifications.
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ThemeToggle className="size-9 rounded-md border-0" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 gap-2 px-1.5 sm:pr-2"
            aria-label="Open user menu"
          >
            <Avatar className="size-8 border">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                RM
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 text-left xl:block">
              <span className="block truncate text-sm font-medium leading-4">
                Rana Mansour
              </span>
              <span className="block truncate text-[0.68rem] leading-4 text-muted-foreground">
                Operations Manager
              </span>
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground xl:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <span className="block text-sm">Rana Mansour</span>
            <span className="block text-xs font-normal text-muted-foreground">
              rana.mansour@nems-ops.com
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs">
            NEMS Operations workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
};

Header.displayName = "Header";
