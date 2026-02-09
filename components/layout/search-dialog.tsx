'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DollarSign,
  Receipt,
  FileText,
  ArrowRight,
  Search,
  CornerDownLeft,
  ArrowUpDown,
  Loader2,
  Sparkles,
} from 'lucide-react';

import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { formatCents, cn } from '@/lib/utils';
import { DEFAULT_TAX_YEAR } from '@/lib/constants';
import { searchAction } from '@/app/(modules)/search/actions';
import type { SearchResult } from '@/server/services/search-service';

const typeConfig = {
  income: {
    icon: DollarSign,
    label: 'Income',
    color: 'text-positive',
    bg: 'bg-positive/10',
    ring: 'ring-positive/20',
  },
  expense: {
    icon: Receipt,
    label: 'Expenses',
    color: 'text-negative',
    bg: 'bg-negative/10',
    ring: 'ring-negative/20',
  },
  document: {
    icon: FileText,
    label: 'Documents',
    color: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
  },
} as const;

const quickLinks = [
  { label: 'Income forms', href: '/income', type: 'income' as const },
  { label: 'Expenses', href: '/expenses', type: 'expense' as const },
  { label: 'Documents', href: '/documents', type: 'document' as const },
];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const year = Number(searchParams.get('year')) || DEFAULT_TAX_YEAR;

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Debounce search to avoid firing a server action per keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.trim().length < 2) {
        setResults([]);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          const { results: r } = await searchAction(year, value.trim());
          setResults(r);
        });
      }, 250);
    },
    [year]
  );

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      setResults([]);
      router.push(href);
    },
    [router]
  );

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const totalResults = results.length;
  const hasQuery = query.trim().length >= 2;
  const showInitialState = !hasQuery && results.length === 0;

  // Clear stale results when dialog closes
  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery('');
      setResults([]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Search" description="Search your tax records">
      <Command shouldFilter={false} className="rounded-xl!">
        {/* Search Input */}
        <div className="relative">
          <CommandInput
            placeholder="Search income, expenses, documents..."
            value={query}
            onValueChange={handleSearch}
          />
          {/* Animated loading indicator in the input area */}
          {isPending && hasQuery && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Subtle separator */}
        <div className="mx-3 h-px bg-border/60" />

        <CommandList className="max-h-80 scroll-py-2 px-1">
          {/* Initial state — quick navigation */}
          {showInitialState && (
            <div className="px-2 py-3">
              <p className="mb-2.5 px-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                Quick navigation
              </p>
              <div className="space-y-0.5">
                {quickLinks.map((link) => {
                  const config = typeConfig[link.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={link.href}
                      onClick={() => handleSelect(link.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2",
                        "text-left text-sm text-muted-foreground",
                        "transition-all duration-150 ease-out",
                        "hover:bg-muted/60 hover:text-foreground",
                        "group/nav"
                      )}
                    >
                      <div className={cn(
                        "flex size-7 items-center justify-center rounded-md",
                        config.bg,
                        "transition-transform duration-200",
                        "group-hover/nav:scale-110"
                      )}>
                        <Icon className={cn("size-3.5", config.color)} />
                      </div>
                      <span className="flex-1 font-medium">{link.label}</span>
                      <ArrowRight className={cn(
                        "size-3.5 opacity-0 -translate-x-1",
                        "transition-all duration-200",
                        "group-hover/nav:opacity-50 group-hover/nav:translate-x-0"
                      )} />
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 px-2 py-1.5">
                <Sparkles className="size-3 text-muted-foreground/40" />
                <span className="text-[11px] text-muted-foreground/50">
                  Type to search across all your {year} tax records
                </span>
              </div>
            </div>
          )}

          {/* Empty state — no results found */}
          {hasQuery && !isPending && results.length === 0 && (
            <CommandEmpty className="py-0">
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted/60">
                  <Search className="size-4 text-muted-foreground/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    No results for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    Try a different term or check your spelling
                  </p>
                </div>
              </div>
            </CommandEmpty>
          )}

          {/* Loading state with skeleton shimmer */}
          {isPending && hasQuery && results.length === 0 && (
            <div className="px-3 py-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="size-7 rounded-md bg-muted/60" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 rounded bg-muted/60" />
                    <div className="h-2.5 w-1/3 rounded bg-muted/40" />
                  </div>
                  <div className="h-3.5 w-16 rounded bg-muted/40" />
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {Object.entries(grouped).map(([type, items], groupIndex) => {
            const config = typeConfig[type as keyof typeof typeConfig];
            const Icon = config.icon;

            return (
              <div key={type}>
                {groupIndex > 0 && <CommandSeparator className="my-1" />}
                <CommandGroup
                  heading={
                    <span className="flex items-center gap-2">
                      <span>{config.label}</span>
                      <span className={cn(
                        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1",
                        "text-[10px] font-semibold tabular-nums",
                        config.bg, config.color
                      )}>
                        {items.length}
                      </span>
                    </span>
                  }
                >
                  {items.map((item, i) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.href)}
                      className={cn(
                        "group/result cursor-pointer gap-3 rounded-lg! px-2.5 py-2",
                        "transition-all duration-150 ease-out",
                        "data-selected:bg-muted/70",
                        "animate-content-show"
                      )}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      {/* Colored icon badge */}
                      <div className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        config.bg,
                        "ring-1 ring-inset", config.ring,
                        "transition-all duration-200",
                        "group-data-selected/result:scale-105"
                      )}>
                        <Icon className={cn("size-3.5", config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                        <span className="truncate text-sm font-medium leading-tight">
                          {item.label}
                        </span>
                        {item.sublabel && (
                          <span className="truncate text-xs text-muted-foreground leading-tight">
                            {item.sublabel}
                          </span>
                        )}
                      </div>

                      {/* Amount + arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.amount !== undefined && (
                          <span className={cn(
                            "text-xs font-mono font-medium tabular-nums",
                            type === 'income' ? "text-positive" : "text-muted-foreground"
                          )}>
                            {formatCents(item.amount)}
                          </span>
                        )}
                        <ArrowRight className={cn(
                          "size-3 text-muted-foreground/40",
                          "opacity-0 transition-all duration-150",
                          "group-data-selected/result:opacity-100",
                          "group-data-selected/result:translate-x-0 -translate-x-1"
                        )} />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            );
          })}
        </CommandList>

        {/* Footer — keyboard hints */}
        <div className={cn(
          "flex items-center gap-4 border-t border-border/60 px-3 py-2",
          "text-[11px] text-muted-foreground/50"
        )}>
          {totalResults > 0 && (
            <span className="font-medium text-muted-foreground/70">
              {totalResults} result{totalResults !== 1 ? 's' : ''}
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/50 bg-muted/40 px-1 font-mono text-[10px]">
                <ArrowUpDown className="size-2.5" />
              </kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/50 bg-muted/40 px-1 font-mono text-[10px]">
                <CornerDownLeft className="size-2.5" />
              </kbd>
              open
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/50 bg-muted/40 px-1 font-mono text-[10px]">
                esc
              </kbd>
              close
            </span>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
