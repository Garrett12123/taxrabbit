'use client';

import { useRouter } from 'next/navigation';
import { DollarSign } from 'lucide-react';
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

type IncomeByTypeData = {
  formType: string;
  totalAmount: number;
  count: number;
};

type Props = {
  data: IncomeByTypeData[];
  year: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IncomeByTypeData }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.formType}</p>
      <p className="text-muted-foreground">
        {formatCents(item.totalAmount)} ({item.count} form{item.count !== 1 ? 's' : ''})
      </p>
    </div>
  );
}

export function IncomeByTypeChart({ data, year }: Props) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60">
          <DollarSign className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No data yet</p>
        <p className="text-xs text-muted-foreground/70">Add income forms to see this chart</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
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
          dataKey="formType"
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="totalAmount"
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={(entry: IncomeByTypeData) => {
            router.push(
              `/income?formType=${encodeURIComponent(entry.formType)}&year=${year}`
            );
          }}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={getChartColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
