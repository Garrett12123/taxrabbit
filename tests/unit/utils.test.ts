import { describe, it, expect } from 'vitest';

import { parseDollarsToCents, formatCents, centsToDollars } from '@/lib/utils';

describe('parseDollarsToCents', () => {
  it('parses simple dollar amount', () => {
    expect(parseDollarsToCents('100')).toBe(10000);
  });

  it('parses with decimal', () => {
    expect(parseDollarsToCents('100.50')).toBe(10050);
  });

  it('parses with dollar sign', () => {
    expect(parseDollarsToCents('$100.00')).toBe(10000);
  });

  it('parses with commas', () => {
    expect(parseDollarsToCents('$1,234.56')).toBe(123456);
  });

  it('handles negative amounts', () => {
    expect(parseDollarsToCents('-50.00')).toBe(-5000);
  });

  it('rounds to nearest cent', () => {
    expect(parseDollarsToCents('10.999')).toBe(1100);
  });

  it('returns null for empty string', () => {
    expect(parseDollarsToCents('')).toBeNull();
  });

  it('returns null for non-numeric', () => {
    expect(parseDollarsToCents('abc')).toBeNull();
  });

  it('returns null for only dollar sign', () => {
    expect(parseDollarsToCents('$')).toBeNull();
  });

  it('handles zero', () => {
    expect(parseDollarsToCents('0')).toBe(0);
    expect(parseDollarsToCents('0.00')).toBe(0);
  });
});

describe('formatCents', () => {
  it('formats cents to dollar string', () => {
    expect(formatCents(10050)).toBe('$100.50');
  });

  it('formats zero', () => {
    expect(formatCents(0)).toBe('$0.00');
  });

  it('formats large amounts with commas', () => {
    const formatted = formatCents(123456789);
    expect(formatted).toContain('1,234,567');
  });
});

describe('centsToDollars', () => {
  it('converts cents to dollar string', () => {
    expect(centsToDollars(10050)).toBe('100.50');
  });

  it('converts zero', () => {
    expect(centsToDollars(0)).toBe('0.00');
  });
});
