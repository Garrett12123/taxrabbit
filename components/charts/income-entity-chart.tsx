'use client';

import { Building2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { formatCents, cn } from '@/lib/utils';

type EntityData = {
  entityType: string;
  totalAmount: number;
  count: number;
};

type Props = {
  data: EntityData[];
};

const ENTITY_COLORS: Record<string, string> = {
  personal: 'hsl(220, 70%, 55%)',
  business: 'hsl(160, 60%, 45%)',
};

const ENTITY_LABELS: Record<string, string> = {
  personal: 'Personal',
  business: 'Business',
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EntityData }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className={cn(
      "rounded-lg border bg-popover/95 backdrop-blur-sm px-4 py-3 text-sm",
      "shadow-[0_8px_24px_-4px_oklch(0_0_0/0.15)]",
      "animate-in fade-in-0 zoom-in-95 duration-150"
    )}>
      <p className="font-semibold text-foreground">
        {ENTITY_LABELS[item.entityType] ?? item.entityType}
      </p>
      <p className="mt-1 text-foreground">
        <span className="font-mono tabular-nums">{formatCents(item.totalAmount)}</span>
        <span className="text-muted-foreground ml-1.5">
          ({item.count} form{item.count !== 1 ? 's' : ''})
        </span>
      </p>
    </div>
  );
}

export function IncomeEntityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[150px] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60">
          <Building2 className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No data yet</p>
        <p className="text-xs text-muted-foreground/70">Add income forms to see entity breakdown</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: ENTITY_LABELS[d.entityType] ?? d.entityType,
  }));

  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatCents(v)}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="totalAmount" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.entityType}
              fill={ENTITY_COLORS[entry.entityType] ?? 'hsl(0, 0%, 60%)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
