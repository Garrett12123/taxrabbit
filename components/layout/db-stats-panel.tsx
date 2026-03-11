'use client';

import * as React from 'react';
import {
  Database,
  ChevronDown,
  HardDrive,
  FileStack,
  Table2,
  Layers,
  CircleDot,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getDbStats, type DbStats } from '@/app/(modules)/db-stats-action';

const TABLE_LABELS: Record<string, string> = {
  tax_years: 'Tax Years',
  person_profiles: 'Persons',
  business_profiles: 'Businesses',
  income_documents: 'Income',
  expenses: 'Expenses',
  document_files: 'Documents',
  custom_categories: 'Categories',
  estimated_payments: 'Est. Payments',
  mileage_logs: 'Mileage',
  utility_bills: 'Utilities',
  checklist_items: 'Checklist',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <Icon className="size-3.5 shrink-0 text-sidebar-foreground/50" />
      <span className="flex-1 text-[11px] text-sidebar-foreground/60">
        {label}
      </span>
      <span className="text-[11px] font-medium tabular-nums text-sidebar-foreground/80">
        {value}
      </span>
    </div>
  );
}

function TableCountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-sidebar-foreground/60">{label}</span>
      <span className={cn(
        'text-[11px] tabular-nums font-medium',
        count > 0 ? 'text-sidebar-foreground/80' : 'text-sidebar-foreground/30',
      )}>
        {count}
      </span>
    </div>
  );
}

export function DbStatsPanel() {
  const [stats, setStats] = React.useState<DbStats | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    getDbStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex h-8 items-center gap-2 rounded-md px-2">
        <Database className="size-4 text-sidebar-foreground/40 animate-pulse" />
        <span className="text-xs text-sidebar-foreground/40">Loading...</span>
      </div>
    );
  }

  const totalSize = stats.fileSizeBytes + stats.walSizeBytes;
  const populatedTables = stats.tables.filter((t) => t.rowCount > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-sidebar-accent">
        <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-accent/80">
          <Database className="size-3.5 text-blue-500" />
        </div>
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-sidebar-foreground/80">
            Database
          </span>
          <Badge
            variant="muted"
            className="h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wider"
          >
            {formatBytes(totalSize)}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-sidebar-foreground/40 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 rounded-md border border-sidebar-border/50 bg-sidebar-accent/30 px-2.5 py-1.5">
          <StatRow
            icon={HardDrive}
            label="DB File"
            value={formatBytes(stats.fileSizeBytes)}
          />
          {stats.walSizeBytes > 0 && (
            <StatRow
              icon={FileStack}
              label="WAL"
              value={formatBytes(stats.walSizeBytes)}
            />
          )}
          <StatRow
            icon={Layers}
            label="Total Rows"
            value={stats.totalRows.toLocaleString()}
          />
          <StatRow
            icon={Table2}
            label="Tables"
            value={`${populatedTables.length} / ${stats.tables.length}`}
          />
          <StatRow
            icon={CircleDot}
            label="Journal"
            value={stats.journalMode.toUpperCase()}
          />

          {/* Table breakdown */}
          {populatedTables.length > 0 && (
            <div className="mt-1.5 border-t border-sidebar-border/30 pt-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Records
              </span>
              <div className="mt-0.5">
                {stats.tables
                  .filter((t) => t.rowCount > 0)
                  .sort((a, b) => b.rowCount - a.rowCount)
                  .map((t) => (
                    <TableCountRow
                      key={t.name}
                      label={TABLE_LABELS[t.name] ?? t.name}
                      count={t.rowCount}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
