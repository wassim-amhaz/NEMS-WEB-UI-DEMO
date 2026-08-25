import {
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  LogOut,
  Search,
  Settings,
} from "lucide-react";

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

export const Header = () => (
  <header className="sticky top-0 z-40 flex h-[4.25rem] shrink-0 items-center gap-2 border-b border-border/80 bg-card/95 px-3 backdrop-blur sm:gap-3 sm:px-5">
    <SidebarTrigger className="size-9 shrink-0 text-muted-foreground" />

    <Select defaultValue="downtown">
      <SelectTrigger
        aria-label="Select branch"
        className="h-9 w-[9.25rem] border-border/80 bg-background shadow-none sm:w-[11rem]"
      >
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="downtown">Downtown Branch</SelectItem>
        <SelectItem value="north">North Branch</SelectItem>
        <SelectItem value="airport">Airport Branch</SelectItem>
      </SelectContent>
    </Select>

    <div className="relative hidden max-w-xl flex-1 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Global search"
        placeholder="Search products, batches, or actions..."
        className="h-9 border-border/80 bg-background pl-9 pr-14 shadow-none"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.65rem] text-muted-foreground lg:inline-flex">
        Ctrl K
      </kbd>
    </div>

    <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
      <Button
        variant="outline"
        className="hidden h-9 gap-2 border-border/80 bg-background px-3 font-normal shadow-none lg:flex"
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span>Last 30 days</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9"
            aria-label="Notifications"
          >
            <Bell className="size-[1.1rem]" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-500 ring-2 ring-card" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-3 py-5 text-center text-sm text-muted-foreground">
            Operational alerts will appear here.
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
              rana@nems.demo
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings /> Preferences
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CircleHelp /> Help & support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
);

Header.displayName = "Header";
