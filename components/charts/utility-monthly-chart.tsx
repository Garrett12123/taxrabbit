'use client';

import { Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

import { formatCents, cn } from '@/lib/utils';
import { CHART_COLORS } from './chart-colors';
import { UTILITY_TYPES } from '@/lib/constants';

type MonthlyByType = {
  month: string;
  utilityType: string;
  total: number;
};

type Props = {
  data: MonthlyByType[];
  year: number;
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type ChartRow = {
  label: string;
  [key: string]: string | number;
};

function pivotData(data: MonthlyByType[], year: number): ChartRow[] {
  // Build a map: month -> { type -> total }
  const byMonth = new Map<string, Record<string, number>>();

  for (const row of data) {
    const existing = byMonth.get(row.month) ?? {};
    existing[row.utilityType] = (existing[row.utilityType] ?? 0) + row.total;
    byMonth.set(row.month, existing);
  }

  return MONTH_LABELS.map((label, i) => {
    const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
    const monthData = byMonth.get(monthKey) ?? {};
    const row: ChartRow = { label };
    for (const type of UTILITY_TYPES) {
      row[type] = monthData[type] ?? 0;
    }
    return row;
  });
}

// Color map for utility types
const UTILITY_COLORS: Record<string, string> = {};
UTILITY_TYPES.forEach((type, i) => {
  UTILITY_COLORS[type] = CHART_COLORS[i % CHART_COLORS.length];
});

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div
      className={cn(
        'rounded-lg border bg-popover/95 backdrop-blur-sm px-4 py-3 text-sm',
        'shadow-[0_8px_24px_-4px_oklch(0_0_0/0.15)]',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
    >
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload
        .filter((entry) => entry.value > 0)
        .map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-mono tabular-nums font-medium text-foreground">
              {formatCents(entry.value)}
            </span>
          </div>
        ))}
      {payload.filter((e) => e.value > 0).length > 1 && (
        <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between gap-4">
          <span className="text-muted-foreground font-medium">Total</span>
          <span className="font-mono tabular-nums font-bold text-foreground">
            {formatCents(total)}
          </span>
        </div>
      )}
    </div>
  );
}

export function UtilityMonthlyChart({ data, year }: Props) {
  const chartData = pivotData(data, year);

  // Find which utility types actually have data
  const activeTypes = UTILITY_TYPES.filter((type) =>
    data.some((row) => row.utilityType === type && row.total > 0)
  );

  if (activeTypes.length === 0) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center gap-4 text-center animate-slide-up">
        <div
          className={cn(
            'flex size-14 items-center justify-center rounded-2xl',
            'bg-gradient-to-br from-muted to-muted/60',
            'shadow-[0_4px_12px_-4px_oklch(0_0_0/0.1)]',
            'animate-float'
          )}
        >
          <Zap className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No data yet</p>
          <p className="text-xs text-muted-foreground">Add utility bills to see monthly trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.5 0 0 / 0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'oklch(0.5 0 0)' }}
            axisLine={{ stroke: 'oklch(0.5 0 0 / 0.1)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCents(v)}
            tick={{ fontSize: 11, fill: 'oklch(0.5 0 0)' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          {activeTypes.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="utilities"
              fill={UTILITY_COLORS[type]}
              radius={type === activeTypes[activeTypes.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
