'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INCOME_FORM_TYPES } from '@/lib/constants';

export function IncomeFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const formType = searchParams.get('formType') ?? 'all';
  const entityType = searchParams.get('entityType') ?? 'all';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/income?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={formType}
        onValueChange={(v) => updateParam('formType', v)}
      >
        <SelectTrigger className="w-[140px]" aria-label="Filter by form type">
          <SelectValue placeholder="Form type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {INCOME_FORM_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
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
    </div>
  );
}
