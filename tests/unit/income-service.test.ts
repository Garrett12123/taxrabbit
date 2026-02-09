import { describe, it, expect } from 'vitest';

import {
  extractPrimaryAmount,
  extractFedWithholding,
} from '@/server/services/income-service';

describe('extractPrimaryAmount', () => {
  it('extracts box1 for W-2', () => {
    expect(extractPrimaryAmount('W-2', { box1: 50000 })).toBe(50000);
  });

  it('extracts box1 for 1099-NEC', () => {
    expect(extractPrimaryAmount('1099-NEC', { box1: 30000 })).toBe(30000);
  });

  it('extracts box1 for 1099-INT', () => {
    expect(extractPrimaryAmount('1099-INT', { box1: 500 })).toBe(500);
  });

  it('extracts box1a for 1099-DIV', () => {
    expect(extractPrimaryAmount('1099-DIV', { box1a: 1200 })).toBe(1200);
  });

  it('sums relevant boxes for 1099-MISC', () => {
    expect(
      extractPrimaryAmount('1099-MISC', {
        box1: 1000,
        box2: 500,
        box3: 200,
        box6: 100,
        box10: 50,
      })
    ).toBe(1850);
  });

  it('returns 0 for unknown form type', () => {
    // @ts-expect-error testing unknown form type
    expect(extractPrimaryAmount('unknown', { box1: 100 })).toBe(0);
  });

  it('returns 0 for non-number box values', () => {
    expect(extractPrimaryAmount('W-2', { box1: 'not a number' })).toBe(0);
  });

  it('returns 0 for missing box', () => {
    expect(extractPrimaryAmount('W-2', {})).toBe(0);
  });
});

describe('extractFedWithholding', () => {
  it('extracts box2 for W-2', () => {
    expect(extractFedWithholding('W-2', { box2: 8000 })).toBe(8000);
  });

  it('extracts box4 for 1099-NEC', () => {
    expect(extractFedWithholding('1099-NEC', { box4: 3000 })).toBe(3000);
  });

  it('extracts box4 for 1099-INT', () => {
    expect(extractFedWithholding('1099-INT', { box4: 100 })).toBe(100);
  });

  it('extracts box4 for 1099-DIV', () => {
    expect(extractFedWithholding('1099-DIV', { box4: 200 })).toBe(200);
  });

  it('extracts box4 for 1099-MISC', () => {
    expect(extractFedWithholding('1099-MISC', { box4: 500 })).toBe(500);
  });

  it('returns 0 for unknown form type', () => {
    // @ts-expect-error testing unknown form type
    expect(extractFedWithholding('unknown', { box4: 100 })).toBe(0);
  });

  it('returns 0 when box is missing', () => {
    expect(extractFedWithholding('W-2', {})).toBe(0);
  });
});
