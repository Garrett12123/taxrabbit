'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { formatCents, cn } from '@/lib/utils';
import { CHART_COLORS } from './chart-colors';

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
  monthNum: string;
  total: number;
};

function aggregateMonthlyTotals(data: MonthlyByType[], year: number): ChartRow[] {
  const byMonth = new Map<string, number>();

  for (const row of data) {
    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.total);
  }

  return MONTH_LABELS.map((label, i) => {
    const monthNum = String(i + 1).padStart(2, '0');
    const key = `${year}-${monthNum}`;
    return {
      label,
      monthNum,
      total: byMonth.get(key) ?? 0,
    };
  });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className={cn(
      "rounded-lg border bg-popover/95 backdrop-blur-sm px-4 py-3 text-sm",
      "shadow-[0_8px_24px_-4px_oklch(0_0_0/0.15)]",
      "animate-in fade-in-0 zoom-in-95 duration-150"
    )}>
      <p className="font-semibold text-foreground">{item.label}</p>
      <p className="mt-1 text-base font-mono font-medium text-foreground tabular-nums">
        {formatCents(item.total)}
      </p>
    </div>
  );
}

export function UtilityCostTrendChart({ data, year }: Props) {
  const router = useRouter();
  const chartData = aggregateMonthlyTotals(data, year);

  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center gap-4 text-center animate-slide-up">
        <div className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          "bg-gradient-to-br from-muted to-muted/60",
          "shadow-[0_4px_12px_-4px_oklch(0_0_0/0.1)]",
          "animate-float"
        )}>
          <TrendingUp className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No data yet</p>
          <p className="text-xs text-muted-foreground">Add utility bills to see cost trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          onClick={(state) => {
            if (state?.activePayload?.[0]) {
              const entry = state.activePayload[0].payload as ChartRow;
              router.push(`/utilities?month=${entry.monthNum}&year=${year}`);
            }
          }}
        >
          <defs>
            <linearGradient id="utilityAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="total"
            stroke={CHART_COLORS[1]}
            fill="url(#utilityAreaGradient)"
            strokeWidth={2.5}
            cursor="pointer"
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
            activeDot={{
              r: 6,
              cursor: 'pointer',
              fill: CHART_COLORS[1],
              stroke: 'var(--background)',
              strokeWidth: 2,
              style: {
                filter: 'drop-shadow(0 2px 4px oklch(0 0 0 / 0.2))',
              }
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
