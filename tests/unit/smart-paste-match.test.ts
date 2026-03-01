import { describe, it, expect } from 'vitest';
import { matchTokensToBoxes } from '@/lib/smart-paste/match';
import { extractTokens } from '@/lib/smart-paste/extract';

describe('matchTokensToBoxes', () => {
  describe('W-2 matching', () => {
    const W2_TEXT = `
      Employer's name: Acme Corporation
      Employer identification number (EIN): 12-3456789
      Employer's address: 123 Main St, Springfield
      Employer state: CA

      1 Wages, tips, other compensation    $75,000.00
      2 Federal income tax withheld         $12,500.00
      3 Social security wages               $75,000.00
      4 Social security tax withheld        $4,650.00
      5 Medicare wages and tips             $75,000.00
      6 Medicare tax withheld               $1,087.50
      16 State wages                        $75,000.00
      17 State income tax                   $3,200.00
    `;

    it('matches W-2 box values correctly', () => {
      const tokens = extractTokens(W2_TEXT);
      const result = matchTokensToBoxes(tokens, 'W-2', W2_TEXT);

      expect(result.boxes.box1).toBe(7500000);
      expect(result.boxes.box2).toBe(1250000);
      expect(result.boxes.box4).toBe(465000);
      expect(result.boxes.box6).toBe(108750);
    });

    it('extracts issuer EIN', () => {
      const tokens = extractTokens(W2_TEXT);
      const result = matchTokensToBoxes(tokens, 'W-2', W2_TEXT);

      expect(result.issuerEin).toBe('123456789');
    });

    it('extracts issuer name', () => {
      const tokens = extractTokens(W2_TEXT);
      const result = matchTokensToBoxes(tokens, 'W-2', W2_TEXT);

      expect(result.issuerName).toContain('Acme');
    });

    it('does not double-assign boxes', () => {
      const tokens = extractTokens(W2_TEXT);
      const result = matchTokensToBoxes(tokens, 'W-2', W2_TEXT);

      // Each box key should appear at most once in matches
      const keys = result.matches.map((m) => m.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('assigns confidence levels', () => {
      const tokens = extractTokens(W2_TEXT);
      const result = matchTokensToBoxes(tokens, 'W-2', W2_TEXT);

      for (const match of result.matches) {
        expect(['high', 'medium', 'low']).toContain(match.confidence);
      }
    });
  });

  describe('1099-NEC matching', () => {
    const NEC_TEXT = `
      Payer's name: Freelance Co
      Payer's TIN: 98-7654321

      1 Nonemployee compensation  $45,000.00
      4 Federal income tax withheld $5,000.00
    `;

    it('matches 1099-NEC box values', () => {
      const tokens = extractTokens(NEC_TEXT);
      const result = matchTokensToBoxes(tokens, '1099-NEC', NEC_TEXT);

      expect(result.boxes.box1).toBe(4500000);
      expect(result.boxes.box4).toBe(500000);
    });

    it('extracts payer EIN', () => {
      const tokens = extractTokens(NEC_TEXT);
      const result = matchTokensToBoxes(tokens, '1099-NEC', NEC_TEXT);

      expect(result.issuerEin).toBe('987654321');
    });
  });

  describe('1099-INT matching', () => {
    const INT_TEXT = `
      Payer's name: Big Bank Inc
      1 Interest income        $1,250.00
      4 Federal income tax withheld $125.00
    `;

    it('matches 1099-INT box values', () => {
      const tokens = extractTokens(INT_TEXT);
      const result = matchTokensToBoxes(tokens, '1099-INT', INT_TEXT);

      expect(result.boxes.box1).toBe(125000);
      expect(result.boxes.box4).toBe(12500);
    });
  });

  describe('1099-DIV matching', () => {
    const DIV_TEXT = `
      Box 1a Total ordinary dividends  $3,500.00
      Box 1b Qualified dividends       $2,000.00
      Box 2a Total capital gain distr.  $500.00
      Box 4 Federal income tax withheld $350.00
    `;

    it('matches 1099-DIV box values', () => {
      const tokens = extractTokens(DIV_TEXT);
      const result = matchTokensToBoxes(tokens, '1099-DIV', DIV_TEXT);

      expect(result.boxes.box1a).toBe(350000);
      expect(result.boxes.box1b).toBe(200000);
      expect(result.boxes.box2a).toBe(50000);
      expect(result.boxes.box4).toBe(35000);
    });
  });

  describe('unmatched tokens', () => {
    it('reports unmatched money tokens', () => {
      const text = `
        Random values: $999.99 $888.88 $777.77 $666.66 $555.55 $444.44
        $333.33 $222.22 $111.11
      `;
      const tokens = extractTokens(text);
      const result = matchTokensToBoxes(tokens, '1099-NEC', text);

      // Most tokens should be unmatched since there are no keywords
      expect(result.unmatched.length).toBeGreaterThan(0);
    });
  });

  describe('state extraction', () => {
    it('extracts state code for W-2', () => {
      const text = 'Employer state: NY  Box 16 State wages $50,000.00';
      const tokens = extractTokens(text);
      const result = matchTokensToBoxes(tokens, 'W-2', text);

      expect(result.issuerState).toBe('NY');
    });
  });
});
