export type ParseCSVOptions = {
  maxRows?: number;
};

export type ParseCSVResult = {
  headers: string[];
  rows: string[][];
  rowCount: number;
};

export function parseCSV(
  text: string,
  options?: ParseCSVOptions
): ParseCSVResult {
  const maxRows = options?.maxRows ?? 10000;
  const maxFieldLength = 100_000; // Prevent unbounded memory from malicious quoted fields

  // Strip BOM
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < input.length && input[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        if (field.length < maxFieldLength) {
          field += ch;
        }
        i++;
      }
    } else {
      if (ch === '"' && field === '') {
        // Per RFC 4180, quotes only start quoted mode at beginning of a field
        inQuotes = true;
        i++;
      } else if (ch === '"') {
        // Mid-field quote — treat as literal character
        field += ch;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        // Handle \r\n
        if (i + 1 < input.length && input[i + 1] === '\n') {
          i += 2;
        } else {
          i++;
        }
        if (rows.length > maxRows) break;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
        if (rows.length > maxRows) break;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Final field/row (handles unterminated quoted fields gracefully)
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // First row is headers
  const headers = rows.length > 0 ? rows[0].map((h) => h.trim()) : [];
  const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell.trim()));

  // Enforce maxRows on data rows only
  const limitedRows = dataRows.slice(0, maxRows);

  return {
    headers,
    rows: limitedRows,
    rowCount: limitedRows.length,
  };
}
