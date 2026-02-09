'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Rabbit, LogOut } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';
import { EnvironmentInfoPanel } from '@/components/layout/environment-info';
import { NAV_ITEMS } from '@/lib/constants';
import { lockAction } from '@/app/(auth)/actions';
import { cn } from '@/lib/utils';

// Split nav into two groups: Core data pages and Tool/utility pages
const CORE_NAV = NAV_ITEMS.slice(0, 5);  // Overview, Income, LLC, Expenses, Documents
const TOOLS_NAV = NAV_ITEMS.slice(5);     // Imports, Mileage, Quarterly, Reports, Checklist, Settings

function NavItem({ item, isActive }: { item: typeof NAV_ITEMS[number]; isActive: boolean; index: number }) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.href}>
          <Icon className={cn(
            "size-4",
            isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
          )} />
          <span className={isActive ? "font-medium" : undefined}>
            {item.label}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/overview" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Rabbit className="size-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              TaxRabbit
            </span>
            <span className="text-[10px] text-sidebar-foreground/50">
              Tax organization
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Core data pages */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {CORE_NAV.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <NavItem key={item.href} item={item} isActive={isActive} index={index} />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-3" />

        {/* Tool / utility pages */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {TOOLS_NAV.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <NavItem key={item.href} item={item} isActive={isActive} index={CORE_NAV.length + index} />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        <EnvironmentInfoPanel />
        <ThemeSwitcher />
        <form action={lockAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start gap-2 h-8",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              "transition-colors duration-150",
              "hover:bg-sidebar-accent",
            )}
          >
            <LogOut className="size-4" />
            <span>Lock Vault</span>
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
