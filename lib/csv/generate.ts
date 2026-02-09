function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCSV(
  headers: string[],
  rows: string[][]
): string {
  const lines: string[] = [headers.map(escapeCSVField).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCSVField).join(','));
  }
  return lines.join('\n') + '\n';
}

export function objectsToCSV<T>(
  columns: { key: string; header: string }[],
  objects: T[],
  extractRow: (obj: T) => Record<string, string>
): string {
  const headers = columns.map((c) => c.header);
  const rows = objects.map((obj) => {
    const extracted = extractRow(obj);
    return columns.map((c) => extracted[c.key] ?? '');
  });
  return generateCSV(headers, rows);
}
