import { describe, it, expect } from 'vitest';
import { extractTokens } from '@/lib/smart-paste/extract';

describe('extractTokens', () => {
  describe('dollar amounts', () => {
    it('extracts amounts with $ sign', () => {
      const tokens = extractTokens('Wages $1,234.56');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(1);
      expect(money[0].value).toBe(123456); // cents
      expect(money[0].raw).toBe('$1,234.56');
    });

    it('extracts amounts without $ sign but with commas', () => {
      const tokens = extractTokens('Total: 45,678.90');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(1);
      expect(money[0].value).toBe(4567890);
    });

    it('extracts amounts with $ and no commas', () => {
      const tokens = extractTokens('Amount $500.00');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(1);
      expect(money[0].value).toBe(50000);
    });

    it('extracts plain decimal amounts (e.g. 100.50)', () => {
      const tokens = extractTokens('Value is 100.50 here');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(1);
      expect(money[0].value).toBe(10050);
    });

    it('extracts multiple amounts', () => {
      const tokens = extractTokens('$1,000.00 and $2,500.50 and $50.00');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(3);
      expect(money.map((m) => m.value)).toEqual([100000, 250050, 5000]);
    });

    it('extracts zero amount', () => {
      const tokens = extractTokens('Balance $0.00');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(1);
      expect(money[0].value).toBe(0);
    });

    it('extracts large amounts', () => {
      const tokens = extractTokens('$123,456,789.01');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(1);
      expect(money[0].value).toBe(12345678901);
    });
  });

  describe('EIN extraction', () => {
    it('extracts EIN pattern XX-XXXXXXX', () => {
      const tokens = extractTokens('EIN: 12-3456789');
      const eins = tokens.filter((t) => t.type === 'ein');
      expect(eins).toHaveLength(1);
      expect(eins[0].value).toBe('12-3456789');
    });

    it('extracts multiple EINs', () => {
      const tokens = extractTokens('Employer 12-3456789 Payer 98-7654321');
      const eins = tokens.filter((t) => t.type === 'ein');
      expect(eins).toHaveLength(2);
    });

    it('does not match incomplete EINs', () => {
      const tokens = extractTokens('Number 12-345678');
      const eins = tokens.filter((t) => t.type === 'ein');
      expect(eins).toHaveLength(0);
    });
  });

  describe('state code extraction', () => {
    it('extracts state codes near state-related keywords', () => {
      const tokens = extractTokens('Employer state: CA');
      const states = tokens.filter((t) => t.type === 'state');
      expect(states).toHaveLength(1);
      expect(states[0].value).toBe('CA');
    });

    it('extracts unambiguous state codes', () => {
      const tokens = extractTokens('Location: NY');
      const states = tokens.filter((t) => t.type === 'state');
      expect(states).toHaveLength(1);
      expect(states[0].value).toBe('NY');
    });

    it('filters out false positive two-letter words', () => {
      // "NO" and "IF" should be filtered out without nearby context
      const tokens = extractTokens('NO IF');
      const states = tokens.filter((t) => t.type === 'state');
      expect(states).toHaveLength(0);
    });
  });

  describe('position tracking', () => {
    it('tracks character positions correctly', () => {
      const text = 'start $100.00 middle $200.00 end';
      const tokens = extractTokens(text);
      const money = tokens.filter((t) => t.type === 'money');
      expect(money[0].position).toBe(text.indexOf('$100.00'));
      expect(money[1].position).toBe(text.indexOf('$200.00'));
    });

    it('returns tokens sorted by position', () => {
      const tokens = extractTokens('EIN 12-3456789 Wages $50,000.00 State CA');
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i].position).toBeGreaterThanOrEqual(tokens[i - 1].position);
      }
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty string', () => {
      expect(extractTokens('')).toEqual([]);
    });

    it('returns empty array for text with no recognizable patterns', () => {
      expect(extractTokens('Hello world, this is plain text.')).toEqual([]);
    });

    it('handles text with only whitespace', () => {
      expect(extractTokens('   \n\n\t  ')).toEqual([]);
    });

    it('handles Windows-style line endings', () => {
      const tokens = extractTokens('Wages\r\n$1,000.00\r\n');
      const money = tokens.filter((t) => t.type === 'money');
      expect(money).toHaveLength(1);
    });
  });

  describe('checkbox extraction', () => {
    it('extracts checked statutory employee', () => {
      const tokens = extractTokens('X Statutory employee');
      const cbs = tokens.filter((t) => t.type === 'checkbox');
      expect(cbs).toHaveLength(1);
      expect((cbs[0].value as string).toLowerCase()).toContain('statutory');
    });

    it('extracts checked retirement plan', () => {
      const tokens = extractTokens('Retirement plan X');
      const cbs = tokens.filter((t) => t.type === 'checkbox');
      expect(cbs).toHaveLength(1);
      expect((cbs[0].value as string).toLowerCase()).toContain('retirement');
    });

    it('does not extract unchecked checkboxes', () => {
      const tokens = extractTokens('Statutory employee Retirement plan Third-party sick pay');
      const cbs = tokens.filter((t) => t.type === 'checkbox');
      expect(cbs).toHaveLength(0);
    });
  });
});
