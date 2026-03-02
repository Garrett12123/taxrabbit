import { describe, it, expect } from 'vitest';

import { computeCompleteness } from '@/lib/completeness';

describe('computeCompleteness', () => {
  it('returns complete when all required W-2 fields are filled', () => {
    const result = computeCompleteness('W-2', {
      box1: 50000,
      box2: 8000,
    }, 'Acme Corp');
    expect(result.status).toBe('complete');
    expect(result.missingRequired).toHaveLength(0);
  });

  it('flags missing issuer name', () => {
    const result = computeCompleteness('W-2', {
      box1: 50000,
      box2: 8000,
    }, '');
    expect(result.missingRequired).toContain('Payer/Employer name');
    expect(result.status).not.toBe('complete');
  });

  it('flags missing required box fields', () => {
    const result = computeCompleteness('W-2', {}, 'Acme Corp');
    expect(result.missingRequired).toContain('Box 1 - Wages, tips, other comp');
    expect(result.missingRequired).toContain('Box 2 - Federal income tax withheld');
  });

  it('treats 0 as valid for money-type required fields', () => {
    // $0 is a legitimate value (e.g., Box 2 = $0 means no withholding)
    const result = computeCompleteness('W-2', {
      box1: 50000,
      box2: 0,
    }, 'Acme Corp');
    expect(result.missingRequired).not.toContain('Box 2 - Federal income tax withheld');
    expect(result.status).toBe('complete');
  });

  it('returns minimal status when very few fields filled', () => {
    const result = computeCompleteness('W-2', {}, '');
    expect(result.status).toBe('minimal');
  });

  it('returns needs-review when 20%+ fields filled but required missing', () => {
    const result = computeCompleteness('W-2', {
      box1: 50000,
      box3: 45000,
      box4: 1000,
      box5: 45000,
      box6: 650,
      box7: 0,
      box8: 0,
    }, 'Acme Corp');
    // box2 is missing (required), but we have 20%+ filled fields (8/32 = 25%)
    expect(result.status).toBe('needs-review');
  });

  it('returns minimal when less than 20% filled', () => {
    const result = computeCompleteness('W-2', {
      box1: 50000,
    }, 'Acme Corp');
    // box2 is missing (required), only 2/32 filled (6.25%)
    expect(result.status).toBe('minimal');
  });

  it('calculates percentage correctly', () => {
    const result = computeCompleteness('1099-NEC', {
      box1: 30000,
    }, 'Client Inc');
    // 1099-NEC has 5 fields + 1 for issuer = 6 total
    // Filled: box1 + issuer = 2
    expect(result.percentage).toBe(Math.round((2 / 6) * 100));
  });

  it('handles 1099-DIV correctly', () => {
    const result = computeCompleteness('1099-DIV', {
      box1a: 1000,
    }, 'Vanguard');
    expect(result.status).toBe('complete');
  });

  it('handles Other form type — complete with box1 and issuer', () => {
    const result = computeCompleteness('Other', {
      box1: 5000,
    }, 'Client LLC');
    expect(result.status).toBe('complete');
    expect(result.missingRequired).toHaveLength(0);
  });

  it('handles Other form type — flags missing box1', () => {
    const result = computeCompleteness('Other', {}, 'Client LLC');
    expect(result.missingRequired).toContain('Gross income');
  });

  it('handles checkbox fields — only true counts as filled', () => {
    const result = computeCompleteness('W-2', {
      box1: 50000,
      box2: 8000,
      box13_statutory: false,
      box13_retirement: true,
    }, 'Employer');
    // box13_statutory: false should not count, box13_retirement: true should
    expect(result.status).toBe('complete');
    expect(result.percentage).toBeGreaterThan(0);
  });
});
