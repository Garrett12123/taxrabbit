import { describe, it, expect } from 'vitest';
import { smartPaste } from '@/lib/smart-paste';

describe('smartPaste integration', () => {
  it('processes a W-2 PDF text end-to-end', () => {
    const w2Text = `
      Form W-2 Wage and Tax Statement 2025

      a Employee's social security number: 123-45-6789
      b Employer identification number (EIN): 12-3456789
      c Employer's name, address, and ZIP code
        Acme Corporation
        123 Main Street
        Springfield, CA 90210

      1 Wages, tips, other compensation    $85,000.00
      2 Federal income tax withheld        $15,300.00
      3 Social security wages              $85,000.00
      4 Social security tax withheld       $5,270.00
      5 Medicare wages and tips            $85,000.00
      6 Medicare tax withheld              $1,232.50
      7 Social security tips               $0.00
      8 Allocated tips                     $0.00

      X Retirement plan

      15 State CA  Employer's state ID number 123456789
      16 State wages, tips, etc.           $85,000.00
      17 State income tax                  $4,500.00
    `;

    const result = smartPaste(w2Text, 'W-2');

    // Core W-2 boxes should be matched
    expect(result.boxes.box1).toBe(8500000);
    expect(result.boxes.box2).toBe(1530000);
    expect(result.boxes.box4).toBe(527000);
    expect(result.boxes.box6).toBe(123250);

    // Issuer info
    expect(result.issuerEin).toBe('123456789');
    expect(result.issuerName).toBeDefined();

    // Checkbox
    expect(result.boxes.box13_retirement).toBe(true);

    // Should have matches with confidence levels
    expect(result.matches.length).toBeGreaterThan(0);
    for (const match of result.matches) {
      expect(['high', 'medium', 'low']).toContain(match.confidence);
    }
  });

  it('processes a 1099-NEC text end-to-end', () => {
    const necText = `
      Form 1099-NEC Nonemployee Compensation 2025

      Payer's TIN: 98-7654321
      Payer's name: Consulting Partners LLC

      1 Nonemployee compensation  $32,000.00
      4 Federal income tax withheld $3,200.00
    `;

    const result = smartPaste(necText, '1099-NEC');

    expect(result.boxes.box1).toBe(3200000);
    expect(result.boxes.box4).toBe(320000);
    expect(result.issuerEin).toBe('987654321');
  });

  it('processes a 1099-INT text end-to-end', () => {
    const intText = `
      Form 1099-INT Interest Income

      Payer's name: National Bank
      Payer's TIN: 55-1234567

      Box 1 Interest income           $2,150.75
      Box 3 Interest on U.S. savings bonds $500.00
      Box 4 Federal income tax withheld   $215.00
    `;

    const result = smartPaste(intText, '1099-INT');

    expect(result.boxes.box1).toBe(215075);
    expect(result.boxes.box3).toBe(50000);
    expect(result.boxes.box4).toBe(21500);
  });

  it('handles garbage input gracefully', () => {
    const garbage = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      No numbers, no tax info, just random text.
    `;

    const result = smartPaste(garbage, 'W-2');

    expect(result.matches).toHaveLength(0);
    expect(Object.keys(result.boxes)).toHaveLength(0);
    expect(result.issuerEin).toBeUndefined();
  });

  it('handles empty input', () => {
    const result = smartPaste('', 'W-2');

    expect(result.matches).toHaveLength(0);
    expect(Object.keys(result.boxes)).toHaveLength(0);
    expect(result.unmatched).toHaveLength(0);
  });

  it('handles text with only numbers and no labels', () => {
    const text = '$100.00 $200.00 $300.00';

    const result = smartPaste(text, 'W-2');

    // No keywords to match against, so all should be unmatched
    expect(result.matches).toHaveLength(0);
    expect(result.unmatched.length).toBe(3);
  });

  it('processes a 1099-DIV text end-to-end', () => {
    const divText = `
      Form 1099-DIV Dividends and Distributions

      Payer's name: Investment Fund Corp
      Payer's TIN: 33-9876543

      Box 1a Total ordinary dividends  $5,600.00
      Box 1b Qualified dividends       $4,200.00
      Box 2a Total capital gain distr.  $1,800.00
      Box 4 Federal income tax withheld $560.00
    `;

    const result = smartPaste(divText, '1099-DIV');

    expect(result.boxes.box1a).toBe(560000);
    expect(result.boxes.box1b).toBe(420000);
    expect(result.boxes.box2a).toBe(180000);
    expect(result.boxes.box4).toBe(56000);
    expect(result.issuerEin).toBe('339876543');
  });
});
