/**
 * Parses utility bill data pasted from provider websites.
 *
 * Supports three formats:
 *
 * 1. CSV (comma-separated with headers):
 *    Date Start,Date End,Category,Description,Amount
 *    2024-12-10,2025-01-09,Internet,Internet Service,$80.24
 *
 * 2. Tabular (tab or multi-space separated):
 *    Bill Date    Usage    Consumption Charges    Other Charges    Total Charges
 *    Dec 01, 2025    2    $ 58.69    $ 1.67    $ 60.36
 *
 * 3. Block/vertical (each bill is a repeating group of lines):
 *    ELECTRIC SERVICE — 150004001
 *    Auto Pay
 *    JOHN DOE
 *    123 MAIN ST, CITY, ST
 *    View Usage
 *    12/01/2025
 *    $78.21
 *    View Bill
 *    $0.00
 *    $78.21
 */

export type ParsedUtilityRow = {
  billDate: string; // YYYY-MM-DD
  usage: number | undefined;
  consumptionCharges: number; // cents
  otherCharges: number; // cents
  amount: number; // cents (total)
};

export type ParseResult = {
  rows: ParsedUtilityRow[];
  errors: string[];
};

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Parse a date like "Dec 01, 2025" or "12/01/2025" or "2025-12-01" into YYYY-MM-DD.
 */
function parseDate(raw: string): string | null {
  const trimmed = raw.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }

  // "Dec 01, 2025" or "December 01, 2025"
  const namedMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (namedMatch) {
    const [, monthStr, day, year] = namedMatch;
    const monthNum = MONTH_MAP[monthStr!.toLowerCase().slice(0, 3)];
    if (monthNum) {
      return `${year}-${monthNum}-${day!.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Parse a money string like "$ 58.69", "$58.69", "58.69" into cents.
 */
function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '').trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

/**
 * Check if a line is a standalone money value (e.g. "$78.21").
 */
function isMoneyLine(line: string): boolean {
  return /^\$?\s*[\d,]+\.\d{2}$/.test(line.trim());
}

/**
 * Split a line into columns by tabs or 2+ spaces.
 */
function splitColumns(line: string): string[] {
  // Try tab-separated first
  if (line.includes('\t')) {
    return line.split('\t').map((c) => c.trim()).filter(Boolean);
  }
  // Fall back to 2+ spaces
  return line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
}

/**
 * Detect if a row is a header row based on common header keywords.
 */
function isHeaderRow(columns: string[]): boolean {
  const joined = columns.join(' ').toLowerCase();
  return (
    joined.includes('bill date') ||
    joined.includes('date') && joined.includes('charges') ||
    joined.includes('total') && joined.includes('usage')
  );
}

type ColumnMap = {
  date: number;
  usage: number;
  consumption: number;
  other: number;
  total: number;
};

function detectColumns(headerCols: string[]): ColumnMap | null {
  const map: Partial<ColumnMap> = {};

  for (let i = 0; i < headerCols.length; i++) {
    const col = headerCols[i].toLowerCase();
    if (col.includes('date') && map.date === undefined) {
      map.date = i;
    } else if (col.includes('usage') && !col.includes('charge') && map.usage === undefined) {
      map.usage = i;
    } else if ((col.includes('consumption') || (col.includes('energy') && col.includes('charge'))) && map.consumption === undefined) {
      map.consumption = i;
    } else if (col.includes('other') && col.includes('charge') && map.other === undefined) {
      map.other = i;
    } else if ((col.includes('total') || col.includes('amount due') || col.includes('amount')) && map.total === undefined) {
      map.total = i;
    }
  }

  if (map.date === undefined || map.total === undefined) return null;

  return {
    date: map.date,
    usage: map.usage ?? -1,
    consumption: map.consumption ?? -1,
    other: map.other ?? -1,
    total: map.total,
  };
}

function parseRowPositional(columns: string[]): ParsedUtilityRow | null {
  if (columns.length < 2) return null;

  let dateIdx = -1;
  for (let i = 0; i < Math.min(columns.length, 2); i++) {
    if (parseDate(columns[i]) !== null) {
      dateIdx = i;
      break;
    }
  }
  if (dateIdx === -1) return null;

  const billDate = parseDate(columns[dateIdx])!;

  const remaining = columns.slice(dateIdx + 1).filter(
    (c) => !c.toLowerCase().includes('download')
  );

  const moneyValues: number[] = [];
  const nonMoneyValues: string[] = [];

  for (const col of remaining) {
    const money = parseMoney(col);
    if (money !== null) {
      moneyValues.push(money);
    } else {
      nonMoneyValues.push(col);
    }
  }

  if (moneyValues.length === 0) return null;

  let usage: number | undefined;
  for (const val of nonMoneyValues) {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      usage = num;
      break;
    }
  }

  let consumptionCharges = 0;
  let otherCharges = 0;
  let amount: number;

  if (moneyValues.length >= 3) {
    consumptionCharges = moneyValues[moneyValues.length - 3];
    otherCharges = moneyValues[moneyValues.length - 2];
    amount = moneyValues[moneyValues.length - 1];
  } else if (moneyValues.length === 2) {
    consumptionCharges = moneyValues[0];
    amount = moneyValues[1];
  } else {
    amount = moneyValues[0];
  }

  return { billDate, usage, consumptionCharges, otherCharges, amount };
}

// ─── Block format parser ──────────────────────────────────────
// Handles formats where each bill is a repeating group of lines,
// with dates and dollar amounts on their own lines.

function parseBlockFormat(lines: string[]): ParseResult {
  const rows: ParsedUtilityRow[] = [];
  const errors: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for a standalone date line
    const billDate = parseDate(line);
    if (!billDate) {
      i++;
      continue;
    }

    // Found a date — now collect money values from subsequent lines
    const moneyValues: number[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const nextLine = lines[j];

      // Stop if we hit another date (start of next block)
      if (parseDate(nextLine) !== null) break;

      // Collect money values
      if (isMoneyLine(nextLine)) {
        const cents = parseMoney(nextLine);
        if (cents !== null) {
          moneyValues.push(cents);
        }
      }

      j++;

      // Don't scan too far — blocks are typically < 10 lines after the date
      if (j - i > 10) break;
    }

    if (moneyValues.length > 0) {
      // Use the last non-zero value as total (providers typically show:
      // bill charge, credits/adjustments, then total due)
      // If all are zero, use 0
      const lastNonZero = [...moneyValues].reverse().find((v) => v > 0);
      const amount = lastNonZero ?? moneyValues[moneyValues.length - 1];

      rows.push({
        billDate,
        usage: undefined,
        consumptionCharges: 0,
        otherCharges: 0,
        amount,
      });
    } else {
      errors.push(`Line ${i + 1}: Found date ${billDate} but no amount followed`);
    }

    i = j;
  }

  return { rows, errors };
}

// ─── CSV format parser ────────────────────────────────────────
// Handles comma-separated data with headers like:
// Date Start,Date End,Category,Description,Amount

/**
 * Check if the input looks like CSV (comma-separated with date/amount headers).
 */
function isCsvFormat(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const header = lines[0];
  if (!header.includes(',')) return false;
  const cols = header.split(',').map((c) => c.trim().toLowerCase());
  return cols.some((c) => c.includes('date')) && cols.some((c) => c.includes('amount') || c.includes('total'));
}

type CsvColumnMap = {
  date: number;
  amount: number;
};

function detectCsvColumns(headerCols: string[]): CsvColumnMap | null {
  let dateIdx = -1;
  let amountIdx = -1;

  for (let i = 0; i < headerCols.length; i++) {
    const col = headerCols[i].toLowerCase();
    // Prefer "date start" over other date columns for billing period start
    if (col === 'date start' || col === 'date' || col === 'bill date') {
      if (dateIdx === -1) dateIdx = i;
    }
    if (col === 'amount' || col === 'total' || col === 'total charges') {
      amountIdx = i;
    }
  }

  if (dateIdx === -1 || amountIdx === -1) return null;
  return { date: dateIdx, amount: amountIdx };
}

function parseCsvFormat(lines: string[]): ParseResult {
  const rows: ParsedUtilityRow[] = [];
  const errors: string[] = [];

  const headerCols = lines[0].split(',').map((c) => c.trim());
  const colMap = detectCsvColumns(headerCols);

  if (!colMap) {
    return { rows: [], errors: ['CSV headers must include a date and amount column.'] };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());

    if (cols.length <= Math.max(colMap.date, colMap.amount)) {
      errors.push(`Row ${i + 1}: Not enough columns`);
      continue;
    }

    const billDate = parseDate(cols[colMap.date]);
    if (!billDate) {
      errors.push(`Row ${i + 1}: Could not parse date "${cols[colMap.date]}"`);
      continue;
    }

    const amount = parseMoney(cols[colMap.amount]);
    if (amount === null) {
      errors.push(`Row ${i + 1}: Could not parse amount "${cols[colMap.amount]}"`);
      continue;
    }

    rows.push({
      billDate,
      usage: undefined,
      consumptionCharges: 0,
      otherCharges: 0,
      amount,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No valid utility bill rows found in the CSV data.');
  }

  return { rows, errors };
}

// ─── Format detection ─────────────────────────────────────────

/**
 * Detect whether the input is tabular or block format.
 *
 * Tabular: most lines have 2+ columns when split by tabs/multi-spaces.
 * Block: most lines are single-value (a date, a dollar amount, or text).
 */
function isBlockFormat(lines: string[]): boolean {
  let singleValueLines = 0;
  let multiColumnLines = 0;

  for (const line of lines) {
    const cols = splitColumns(line);
    if (cols.length >= 2) {
      multiColumnLines++;
    } else {
      singleValueLines++;
    }
  }

  // Block format: vast majority of lines are single-value (one item per line)
  // Tabular: most lines have 2+ columns
  return singleValueLines > multiColumnLines * 3;
}

// ─── Main entry point ─────────────────────────────────────────

export function parseUtilityPaste(text: string): ParseResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ['No data found in pasted text.'] };
  }

  // Detect format — check CSV first, then block, then tabular
  if (isCsvFormat(lines)) {
    return parseCsvFormat(lines);
  }

  if (isBlockFormat(lines)) {
    const result = parseBlockFormat(lines);
    if (result.rows.length === 0 && result.errors.length === 0) {
      result.errors.push('No valid utility bill rows found in the pasted text.');
    }
    return result;
  }

  // Tabular format
  const rows: ParsedUtilityRow[] = [];
  const errors: string[] = [];

  const firstCols = splitColumns(lines[0]);
  let columnMap: ColumnMap | null = null;
  let startIdx = 0;

  if (isHeaderRow(firstCols)) {
    columnMap = detectColumns(firstCols);
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitColumns(lines[i]);

    if (cols.length < 2) continue;

    let row: ParsedUtilityRow | null = null;

    if (columnMap) {
      const dateStr = cols[columnMap.date];
      const billDate = dateStr ? parseDate(dateStr) : null;
      if (!billDate) {
        errors.push(`Row ${i + 1}: Could not parse date "${dateStr}"`);
        continue;
      }

      const totalStr = cols[columnMap.total];
      const amount = totalStr ? parseMoney(totalStr) : null;
      if (amount === null) {
        errors.push(`Row ${i + 1}: Could not parse total amount "${totalStr}"`);
        continue;
      }

      const usageStr = columnMap.usage >= 0 ? cols[columnMap.usage] : undefined;
      const usage = usageStr ? parseFloat(usageStr) : undefined;

      const consStr = columnMap.consumption >= 0 ? cols[columnMap.consumption] : undefined;
      const consumptionCharges = consStr ? parseMoney(consStr) ?? 0 : 0;

      const otherStr = columnMap.other >= 0 ? cols[columnMap.other] : undefined;
      const otherCharges = otherStr ? parseMoney(otherStr) ?? 0 : 0;

      row = {
        billDate,
        usage: usage !== undefined && !isNaN(usage) ? usage : undefined,
        consumptionCharges,
        otherCharges,
        amount,
      };
    } else {
      row = parseRowPositional(cols);
      if (!row) {
        const hasDate = cols.some((c) => parseDate(c) !== null);
        if (hasDate) {
          errors.push(`Row ${i + 1}: Could not parse row`);
        }
        continue;
      }
    }

    if (row.amount >= 0) {
      rows.push(row);
    }
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No valid utility bill rows found in the pasted text.');
  }

  return { rows, errors };
}
