'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

type ExpenseFiltersProps = {
  customCategories: string[];
};

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function ExpenseFilters({ customCategories }: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? 'all';
  const entityType = searchParams.get('entityType') ?? 'all';
  const month = searchParams.get('month') ?? 'all';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/expenses?${params.toString()}`);
  };

  const allCategories = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.filter(
      (c) => !(EXPENSE_CATEGORIES as readonly string[]).includes(c)
    ),
  ];

  return (
    <div className="flex items-center gap-2">
      <Select
        value={category}
        onValueChange={(v) => updateParam('category', v)}
      >
        <SelectTrigger className="w-[160px]" aria-label="Filter by category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {allCategories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={entityType}
        onValueChange={(v) => updateParam('entityType', v)}
      >
        <SelectTrigger className="w-[140px]" aria-label="Filter by entity">
          <SelectValue placeholder="Entity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Entities</SelectItem>
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="business">Business</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={month}
        onValueChange={(v) => updateParam('month', v)}
      >
        <SelectTrigger className="w-[140px]" aria-label="Filter by month">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
