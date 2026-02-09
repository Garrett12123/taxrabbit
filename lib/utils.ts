import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

export function parseDollarsToCents(str: string): number | null {
  const trimmed = str.trim();
  // Handle accounting-style negatives: (1,234.56) → -1234.56
  const isAccountingNegative = trimmed.startsWith('(') && trimmed.endsWith(')');
  const unwrapped = isAccountingNegative ? trimmed.slice(1, -1) : trimmed;
  const cleaned = unwrapped.replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (isNaN(num)) return null;
  const cents = Math.round(num * 100);
  return isAccountingNegative ? -cents : cents;
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
