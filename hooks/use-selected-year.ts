'use client';

import { useSearchParams } from 'next/navigation';
import { DEFAULT_TAX_YEAR, TAX_YEARS, type TaxYear } from '@/lib/constants';

export function useSelectedYear(): TaxYear {
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');

  if (yearParam) {
    const parsed = Number(yearParam);
    if ((TAX_YEARS as readonly number[]).includes(parsed)) {
      return parsed as TaxYear;
    }
  }

  return DEFAULT_TAX_YEAR;
}
