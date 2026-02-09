'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { formatCents } from '@/lib/utils';
import { getChartColor } from './chart-colors';

type IncomeByPayerData = {
  payerName: string;
  totalAmount: number;
  count: number;
};

type Props = {
  data: IncomeByPayerData[];
  year: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IncomeByPayerData }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.payerName}</p>
      <p className="text-muted-foreground">
        {formatCents(item.totalAmount)} ({item.count} form{item.count !== 1 ? 's' : ''})
      </p>
    </div>
  );
}

export function IncomeByPayerChart({ data, year }: Props) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60">
          <Users className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No data yet</p>
        <p className="text-xs text-muted-foreground/70">Add income forms to see payer breakdown</p>
      </div>
    );
  }

  // Top 10 payers, group remainder as "Other"
  let chartData: IncomeByPayerData[];
  if (data.length > 10) {
    const top10 = data.slice(0, 10);
    const rest = data.slice(10);
    const otherTotal = rest.reduce((s, r) => s + r.totalAmount, 0);
    const otherCount = rest.reduce((s, r) => s + r.count, 0);
    chartData = [...top10, { payerName: 'Other', totalAmount: otherTotal, count: otherCount }];
  } else {
    chartData = data;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
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
          dataKey="payerName"
          width={120}
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) => v.length > 16 ? `${v.slice(0, 14)}...` : v}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="totalAmount"
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={() => {
            router.push(`/income?year=${year}`);
          }}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={getChartColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
