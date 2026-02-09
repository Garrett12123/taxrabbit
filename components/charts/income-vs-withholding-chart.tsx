'use client';

import { ShieldCheck } from 'lucide-react';
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

type MonthlyIncome = { month: string; total: number };
type MonthlyWithholding = {
  month: string;
  fedWithholding: number;
  stateWithholding: number;
};

type Props = {
  incomeData: MonthlyIncome[];
  withholdingData: MonthlyWithholding[];
  year: number;
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type MergedRow = {
  label: string;
  income: number;
  withholding: number;
};

function mergeData(
  incomeData: MonthlyIncome[],
  withholdingData: MonthlyWithholding[],
  year: number
): MergedRow[] {
  const incomeMap = new Map(incomeData.map((d) => [d.month, d.total]));
  const whMap = new Map(
    withholdingData.map((d) => [
      d.month,
      d.fedWithholding + d.stateWithholding,
    ])
  );

  return MONTH_LABELS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    return {
      label,
      income: incomeMap.get(key) ?? 0,
      withholding: whMap.get(key) ?? 0,
    };
  });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === 'income')?.value ?? 0;
  const withholding =
    payload.find((p) => p.dataKey === 'withholding')?.value ?? 0;
  const rate = income > 0 ? ((withholding / income) * 100).toFixed(1) : '0.0';

  return (
    <div
      className={cn(
        'rounded-lg border bg-popover/95 backdrop-blur-sm px-4 py-3 text-sm',
        'shadow-[0_8px_24px_-4px_oklch(0_0_0/0.15)]',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
    >
      <p className="font-semibold text-foreground">{label}</p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center gap-2 text-foreground">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ backgroundColor: CHART_COLORS[1] }}
          />
          Income: <span className="font-mono tabular-nums">{formatCents(income)}</span>
        </p>
        <p className="flex items-center gap-2 text-foreground">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ backgroundColor: CHART_COLORS[3] }}
          />
          Withholding: <span className="font-mono tabular-nums">{formatCents(withholding)}</span>
        </p>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Effective rate: {rate}%
      </p>
    </div>
  );
}

export function IncomeVsWithholdingChart({
  incomeData,
  withholdingData,
  year,
}: Props) {
  const hasData = incomeData.length > 0;

  if (!hasData) {
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
          <ShieldCheck className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No data yet</p>
          <p className="text-xs text-muted-foreground">
            Add income forms to compare income vs withholding
          </p>
        </div>
      </div>
    );
  }

  const chartData = mergeData(incomeData, withholdingData, year);

  return (
    <div className="animate-slide-up">
      <ResponsiveContainer width="100%" height={250}>
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
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="income"
            name="Income"
            fill={CHART_COLORS[1]}
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
          <Bar
            dataKey="withholding"
            name="Withholding"
            fill={CHART_COLORS[3]}
            radius={[4, 4, 0, 0]}
            animationBegin={200}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
