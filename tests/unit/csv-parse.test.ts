import { describe, it, expect } from 'vitest';

import { parseCSV } from '@/lib/csv/parse';

describe('parseCSV', () => {
  it('parses basic CSV', () => {
    const result = parseCSV('name,amount\nAlice,100\nBob,200');
    expect(result.headers).toEqual(['name', 'amount']);
    expect(result.rows).toEqual([
      ['Alice', '100'],
      ['Bob', '200'],
    ]);
    expect(result.rowCount).toBe(2);
  });

  it('handles BOM character', () => {
    const result = parseCSV('\uFEFFname,amount\nAlice,100');
    expect(result.headers).toEqual(['name', 'amount']);
    expect(result.rows).toEqual([['Alice', '100']]);
  });

  it('handles quoted fields', () => {
    const result = parseCSV('name,description\nAlice,"Hello, World"\nBob,"Line1\nLine2"');
    expect(result.rows[0]).toEqual(['Alice', 'Hello, World']);
    expect(result.rows[1]).toEqual(['Bob', 'Line1\nLine2']);
  });

  it('handles escaped quotes', () => {
    const result = parseCSV('name,value\nAlice,"She said ""hello"""\n');
    expect(result.rows[0]).toEqual(['Alice', 'She said "hello"']);
  });

  it('handles CRLF line endings', () => {
    const result = parseCSV('name,amount\r\nAlice,100\r\nBob,200\r\n');
    expect(result.headers).toEqual(['name', 'amount']);
    expect(result.rowCount).toBe(2);
  });

  it('handles CR-only line endings', () => {
    const result = parseCSV('name,amount\rAlice,100\rBob,200');
    expect(result.headers).toEqual(['name', 'amount']);
    expect(result.rowCount).toBe(2);
  });

  it('skips empty data rows', () => {
    const result = parseCSV('name,amount\nAlice,100\n\n\nBob,200');
    expect(result.rowCount).toBe(2);
  });

  it('returns empty for empty input', () => {
    const result = parseCSV('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('returns headers only when no data rows', () => {
    const result = parseCSV('name,amount\n');
    expect(result.headers).toEqual(['name', 'amount']);
    expect(result.rowCount).toBe(0);
  });

  it('trims header whitespace', () => {
    const result = parseCSV(' name , amount \nAlice,100');
    expect(result.headers).toEqual(['name', 'amount']);
  });

  it('respects maxRows option', () => {
    const csv = 'h\n' + Array.from({ length: 100 }, (_, i) => `row${i}`).join('\n');
    const result = parseCSV(csv, { maxRows: 5 });
    expect(result.rowCount).toBe(5);
  });
});
