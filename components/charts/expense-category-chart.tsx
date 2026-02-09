'use client';

import { useRouter } from 'next/navigation';
import { PieChartIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { formatCents, cn } from '@/lib/utils';
import { getChartColor } from './chart-colors';

type ExpenseCategoryData = {
  category: string;
  total: number;
  count: number;
};

type Props = {
  data: ExpenseCategoryData[];
  year: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ExpenseCategoryData }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className={cn(
      "rounded-lg border bg-popover/95 backdrop-blur-sm px-4 py-3 text-sm",
      "shadow-[0_8px_24px_-4px_oklch(0_0_0/0.15)]",
      "animate-in fade-in-0 zoom-in-95 duration-150"
    )}>
      <p className="font-semibold text-foreground">{item.category}</p>
      <div className="mt-1.5 space-y-0.5">
        <p className="text-muted-foreground flex items-baseline gap-2">
          <span className="text-base font-mono font-medium text-foreground tabular-nums">
            {formatCents(item.total)}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {item.count} expense{item.count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

export function ExpenseCategoryChart({ data, year }: Props) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-4 text-center animate-slide-up">
        <div className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          "bg-gradient-to-br from-muted to-muted/60",
          "shadow-[0_4px_12px_-4px_oklch(0_0_0/0.1)]",
          "animate-float"
        )}>
          <PieChartIcon className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No data yet</p>
          <p className="text-xs text-muted-foreground">Add expenses to see category breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            cursor="pointer"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
            onClick={(entry: ExpenseCategoryData) => {
              router.push(
                `/expenses?category=${encodeURIComponent(entry.category)}&year=${year}`
              );
            }}
          >
            {data.map((_, index) => (
              <Cell 
                key={index} 
                fill={getChartColor(index)}
                className="transition-all duration-200 hover:opacity-80"
                style={{
                  filter: 'drop-shadow(0 2px 4px oklch(0 0 0 / 0.1))',
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {value.length > 18 ? `${value.slice(0, 16)}...` : value}
              </span>
            )}
            wrapperStyle={{
              paddingTop: '16px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
