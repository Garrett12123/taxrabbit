'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Plus, FileText, Receipt, Upload, ChevronDown, Search } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchDialog } from '@/components/layout/search-dialog';
import { NAV_ITEMS, TAX_YEARS, DEFAULT_TAX_YEAR } from '@/lib/constants';
import { cn } from '@/lib/utils';

function SearchTrigger() {
  const handleClick = () => {
    // Dispatch Cmd+K to open the search dialog
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true })
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn(
        "hidden sm:flex items-center gap-2 text-muted-foreground",
        "h-8 w-52 justify-start px-3",
        "border-input/60 bg-muted/30",
        "hover:text-foreground hover:bg-muted/50 hover:border-input",
        "transition-all duration-200"
      )}
    >
      <Search className="size-3.5 opacity-50" />
      <span className="flex-1 text-left text-xs">Search records...</span>
      <kbd className={cn(
        "pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-0.5",
        "rounded border border-border/60 bg-background/80 px-1.5",
        "font-mono text-[10px] font-medium text-muted-foreground/70"
      )}>
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);

  const selectedYear = searchParams.get('year') ?? String(DEFAULT_TAX_YEAR);

  const currentPage = NAV_ITEMS.find((item) =>
    pathname.startsWith(item.href)
  );
  const pageTitle = currentPage?.label ?? 'Dashboard';

  const handleYearChange = useCallback(
    (year: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('year', year);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Track scroll for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm",
        "transition-shadow duration-200",
        scrolled && "shadow-[0_1px_2px_0_oklch(0_0_0/0.04)]"
      )}
    >
      <div className="flex h-14 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <SidebarTrigger />

        <span className="text-sm font-medium text-foreground">
          {pageTitle}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {/* Search trigger */}
          <SearchTrigger />
          <SearchDialog />

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Tax Year
            </span>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger
                aria-label="Tax year"
                className="h-8 w-[5.5rem] text-sm font-medium"
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent align="end">
                {TAX_YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm"
                className="gap-1.5 group/add"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add</span>
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem 
                onClick={() => router.push('/income')}
                className="gap-2.5 py-2 cursor-pointer"
              >
                <FileText className="size-4 text-muted-foreground shrink-0 self-center" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">Income Form</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">W-2, 1099, etc.</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/expenses')}
                className="gap-2.5 py-2 cursor-pointer"
              >
                <Receipt className="size-4 text-muted-foreground shrink-0 self-center" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">Expense</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">Track a deduction</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/documents')}
                className="gap-2.5 py-2 cursor-pointer"
              >
                <Upload className="size-4 text-muted-foreground shrink-0 self-center" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">Document</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">Upload a receipt</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
