import { describe, it, expect } from 'vitest';

import { parseUtilityPaste } from '@/lib/utility-paste/parse';

describe('parseUtilityPaste', () => {
  describe('with header row (tab-separated)', () => {
    it('parses the example water bill data', () => {
      const text = `Bill Date\tUsage\tConsumption Charges\tOther Charges\tTotal Charges\tDownload
Dec 01, 2025\t2\t$ 58.69\t$ 1.67\t$ 60.36\tDownloadDownload
Nov 01, 2025\t4\t$ 60.45\t$ 1.67\t$ 62.12\tDownloadDownload
Oct 01, 2025\t2\t$ 58.69\t$ 1.67\t$ 60.36\tDownloadDownload`;

      const result = parseUtilityPaste(text);

      expect(result.errors).toHaveLength(0);
      expect(result.rows).toHaveLength(3);

      // First row: Dec 01, 2025
      expect(result.rows[0].billDate).toBe('2025-12-01');
      expect(result.rows[0].usage).toBe(2);
      expect(result.rows[0].consumptionCharges).toBe(5869);
      expect(result.rows[0].otherCharges).toBe(167);
      expect(result.rows[0].amount).toBe(6036);

      // Second row: Nov 01, 2025
      expect(result.rows[1].billDate).toBe('2025-11-01');
      expect(result.rows[1].usage).toBe(4);
      expect(result.rows[1].amount).toBe(6212);
    });

    it('parses full 12-month water bill', () => {
      const text = `Bill Date\tUsage\tConsumption Charges\tOther Charges\tTotal Charges\tDownload\t
Dec 01, 2025\t2\t$ 58.69\t$ 1.67\t$ 60.36\tDownloadDownload\t
Nov 01, 2025\t4\t$ 60.45\t$ 1.67\t$ 62.12\tDownloadDownload\t
Oct 01, 2025\t2\t$ 58.69\t$ 1.67\t$ 60.36\tDownloadDownload\t
Sep 01, 2025\t4\t$ 59.26\t$ 1.62\t$ 60.88\tDownloadDownload\t
Aug 01, 2025\t2\t$ 57.50\t$ 1.62\t$ 59.12\tDownloadDownload\t
Jul 01, 2025\t2\t$ 57.50\t$ 1.62\t$ 59.12\tDownloadDownload\t
Jun 01, 2025\t2\t$ 57.50\t$ 1.62\t$ 59.12\tDownloadDownload\t
May 01, 2025\t4\t$ 59.26\t$ 1.62\t$ 60.88\tDownloadDownload\t
Apr 01, 2025\t2\t$ 57.50\t$ 1.62\t$ 59.12\tDownloadDownload\t
Mar 01, 2025\t2\t$ 57.50\t$ 1.62\t$ 59.12\tDownloadDownload\t
Feb 01, 2025\t2\t$ 57.50\t$ 1.62\t$ 59.12\tDownloadDownload\t
Jan 01, 2025\t4\t$ 59.26\t$ 1.62\t$ 60.88\tDownloadDownload\t`;

      const result = parseUtilityPaste(text);

      expect(result.errors).toHaveLength(0);
      expect(result.rows).toHaveLength(12);

      // Verify all months present
      const months = result.rows.map((r) => r.billDate.slice(5, 7));
      expect(months).toContain('01');
      expect(months).toContain('12');

      const totalCents = result.rows.reduce((s, r) => s + r.amount, 0);
      expect(totalCents).toBe(72020);
    });
  });

  describe('with multi-space separation', () => {
    it('parses space-separated data', () => {
      const text = `Bill Date    Usage    Consumption Charges    Other Charges    Total Charges    Download
Dec 01, 2025    2    $ 58.69    $ 1.67    $ 60.36    DownloadDownload
Nov 01, 2025    4    $ 60.45    $ 1.67    $ 62.12    DownloadDownload    `;

      const result = parseUtilityPaste(text);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].billDate).toBe('2025-12-01');
      expect(result.rows[0].amount).toBe(6036);
      expect(result.rows[1].billDate).toBe('2025-11-01');
      expect(result.rows[1].amount).toBe(6212);
    });
  });

  describe('without header row', () => {
    it('parses data rows using positional heuristics', () => {
      const text = `Dec 01, 2025\t2\t$ 58.69\t$ 1.67\t$ 60.36
Nov 01, 2025\t4\t$ 60.45\t$ 1.67\t$ 62.12`;

      const result = parseUtilityPaste(text);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].billDate).toBe('2025-12-01');
      expect(result.rows[0].amount).toBe(6036);
    });
  });

  describe('date formats', () => {
    it('handles YYYY-MM-DD dates', () => {
      const text = `Date\tTotal\n2025-12-01\t$ 60.36`;
      const result = parseUtilityPaste(text);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].billDate).toBe('2025-12-01');
    });

    it('handles MM/DD/YYYY dates', () => {
      const text = `Date\tTotal\n12/01/2025\t$ 60.36`;
      const result = parseUtilityPaste(text);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].billDate).toBe('2025-12-01');
    });

    it('handles "December 01, 2025" style dates', () => {
      const text = `Date\tTotal\nDecember 01, 2025\t$ 60.36`;
      const result = parseUtilityPaste(text);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].billDate).toBe('2025-12-01');
    });
  });

  describe('money formats', () => {
    it('handles amounts without dollar sign', () => {
      const text = `Date\tTotal\n2025-01-15\t60.36`;
      const result = parseUtilityPaste(text);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].amount).toBe(6036);
    });

    it('handles amounts with comma separators', () => {
      const text = `Date\tTotal\n2025-01-15\t$ 1,234.56`;
      const result = parseUtilityPaste(text);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].amount).toBe(123456);
    });
  });

  describe('block/vertical format (electric bill style)', () => {
    it('parses repeating block format with date and amounts on separate lines', () => {
      const text = `ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
12/01/2025
$78.21
View Bill
$0.00
$78.21
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
11/03/2025
$82.38
View Bill
$0.00
$82.38
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
10/01/2025
$86.77
View Bill
$0.00
$86.77`;

      const result = parseUtilityPaste(text);

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].billDate).toBe('2025-12-01');
      expect(result.rows[0].amount).toBe(7821);
      expect(result.rows[1].billDate).toBe('2025-11-03');
      expect(result.rows[1].amount).toBe(8238);
      expect(result.rows[2].billDate).toBe('2025-10-01');
      expect(result.rows[2].amount).toBe(8677);
    });

    it('parses full 12-month electric bill', () => {
      const text = `ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
12/01/2025
$78.21
View Bill
$0.00
$78.21
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
11/03/2025
$82.38
View Bill
$0.00
$82.38
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
10/01/2025
$86.77
View Bill
$0.00
$86.77
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
09/02/2025
$100.06
View Bill
$0.00
$100.06
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
08/01/2025
$96.92
View Bill
$0.00
$96.92
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
07/01/2025
$89.92
View Bill
$0.00
$89.92
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
06/02/2025
$82.93
View Bil
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
05/01/2025
$79.75
View Bill
$0.00
$79.75
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
04/01/2025
$84.02
View Bill
$0.00
$84.02
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
03/03/2025
$123.38
View Bill
$0.00
$123.38
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
02/03/2025
$127.43
View Bill
$0.00
$127.43
ELECTRIC SERVICE — 150004001
Auto Pay
JOHN DOE
123 MAIN ST, CITY, ST
View Usage
01/02/2025
$99.25
View Bill
$0.00
$99.25`;

      const result = parseUtilityPaste(text);

      expect(result.rows).toHaveLength(12);

      // Verify all months present
      const months = result.rows.map((r) => r.billDate.slice(5, 7));
      expect(months).toEqual(['12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01']);

      // Verify specific amounts
      expect(result.rows[0].amount).toBe(7821);  // Dec
      expect(result.rows[6].amount).toBe(8293);  // Jun (incomplete block, only 1 money value)
      expect(result.rows[9].amount).toBe(12338); // Mar
      expect(result.rows[11].amount).toBe(9925);  // Jan

      // Total for the year
      const total = result.rows.reduce((s, r) => s + r.amount, 0);
      expect(total).toBe(113102);
    });

    it('handles block with only one money value (truncated entry)', () => {
      const text = `View Usage
06/02/2025
$82.93
View Bil`;

      const result = parseUtilityPaste(text);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].billDate).toBe('2025-06-02');
      expect(result.rows[0].amount).toBe(8293);
    });
  });

  describe('edge cases', () => {
    it('returns error for empty input', () => {
      const result = parseUtilityPaste('');
      expect(result.rows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });

    it('returns error for gibberish input', () => {
      const result = parseUtilityPaste('hello world\nfoo bar baz');
      expect(result.rows).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles minimal header (just date and total)', () => {
      const text = `Date\tAmount Due\n2025-06-15\t$ 125.00`;
      const result = parseUtilityPaste(text);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].amount).toBe(12500);
    });
  });
});
