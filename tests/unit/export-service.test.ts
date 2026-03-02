import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('@/server/db/dal/utility-bills', () => ({
  listUtilityBillsByYear: vi.fn(),
}));

vi.mock('@/server/db/dal/estimated-payments', () => ({
  listEstimatedPaymentsByYear: vi.fn(),
}));

vi.mock('@/server/db/dal/expenses', () => ({
  listExpensesByYear: vi.fn(),
}));

vi.mock('@/server/db/dal/income-documents', () => ({
  listIncomeDocumentsByYear: vi.fn(),
}));

vi.mock('@/server/db/dal/mileage-logs', () => ({
  listMileageLogsByYear: vi.fn(),
}));

import {
  exportUtilityBillsCsv,
  exportEstimatedPaymentsCsv,
  sanitizeFilename,
  insertCounterBeforeExt,
  generatePersonProfileText,
  generateBusinessProfileText,
} from '@/server/services/export-service';

import { listUtilityBillsByYear } from '@/server/db/dal/utility-bills';
import { listEstimatedPaymentsByYear } from '@/server/db/dal/estimated-payments';

const mockListUtilityBills = vi.mocked(listUtilityBillsByYear);
const mockListEstimatedPayments = vi.mocked(listEstimatedPaymentsByYear);

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── sanitizeFilename ─────────────────────────────────────────

describe('sanitizeFilename', () => {
  it('replaces unsafe characters with underscores', () => {
    expect(sanitizeFilename('file<name>:test')).toBe('file_name_test');
  });

  it('collapses consecutive underscores', () => {
    expect(sanitizeFilename('a::b//c')).toBe('a_b_c');
  });

  it('trims leading/trailing underscores', () => {
    expect(sanitizeFilename(':::hello:::')).toBe('hello');
  });

  it('limits length to 100 characters', () => {
    const long = 'a'.repeat(150);
    expect(sanitizeFilename(long).length).toBe(100);
  });

  it('returns "unnamed" for empty result', () => {
    expect(sanitizeFilename(':::')).toBe('unnamed');
  });

  it('handles normal filenames unchanged', () => {
    expect(sanitizeFilename('my-report.pdf')).toBe('my-report.pdf');
  });

  it('replaces null bytes', () => {
    expect(sanitizeFilename('file\x00name')).toBe('file_name');
  });
});

// ─── insertCounterBeforeExt ──────────────────────────────────

describe('insertCounterBeforeExt', () => {
  it('inserts counter before extension', () => {
    expect(insertCounterBeforeExt('file.pdf', 1)).toBe('file-1.pdf');
  });

  it('handles multiple extensions', () => {
    expect(insertCounterBeforeExt('archive.tar.gz', 2)).toBe('archive.tar-2.gz');
  });

  it('handles no extension', () => {
    expect(insertCounterBeforeExt('README', 3)).toBe('README-3');
  });

  it('handles dotfile with no extension', () => {
    // path.extname('.gitignore') is '' in Node.js
    expect(insertCounterBeforeExt('.gitignore', 1)).toBe('.gitignore-1');
  });
});

// ─── generatePersonProfileText ──────────────────────────────

describe('generatePersonProfileText', () => {
  it('returns placeholder when no profiles', () => {
    expect(generatePersonProfileText([])).toBe('No taxpayer profiles recorded.\n');
  });

  it('masks SSN showing only last 4 digits', () => {
    const result = generatePersonProfileText([
      {
        id: 'p1',
        year: 2025,
        label: 'Primary',
        createdAt: '',
        updatedAt: '',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          ssn: '123-45-6789',
        },
      },
    ]);
    expect(result).toContain('***-**-6789');
    expect(result).not.toContain('123-45');
  });

  it('masks short SSN with fallback', () => {
    const result = generatePersonProfileText([
      {
        id: 'p1',
        year: 2025,
        label: 'Primary',
        createdAt: '',
        updatedAt: '',
        payload: {
          firstName: 'Jane',
          lastName: 'Doe',
          ssn: '12',
        },
      },
    ]);
    expect(result).toContain('***-**-****');
  });

  it('renders all fields when present', () => {
    const result = generatePersonProfileText([
      {
        id: 'p1',
        year: 2025,
        label: 'Primary',
        createdAt: '',
        updatedAt: '',
        payload: {
          firstName: 'Alice',
          lastName: 'Smith',
          ssn: '111-22-3333',
          dateOfBirth: '1990-01-15',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          phone: '555-1234',
          email: 'alice@example.com',
        },
      },
    ]);
    expect(result).toContain('Name: Alice Smith');
    expect(result).toContain('Date of Birth: 1990-01-15');
    expect(result).toContain('Address: 123 Main St');
    expect(result).toContain('Springfield, IL, 62701');
    expect(result).toContain('Phone: 555-1234');
    expect(result).toContain('Email: alice@example.com');
  });

  it('omits SSN line when not provided', () => {
    const result = generatePersonProfileText([
      {
        id: 'p1',
        year: 2025,
        label: 'Primary',
        createdAt: '',
        updatedAt: '',
        payload: {
          firstName: 'Bob',
          lastName: 'Jones',
        },
      },
    ]);
    expect(result).not.toContain('SSN');
  });
});

// ─── generateBusinessProfileText ─────────────────────────────

describe('generateBusinessProfileText', () => {
  it('returns placeholder when no profile', () => {
    expect(generateBusinessProfileText(null)).toBe('No business profile recorded.\n');
  });

  it('renders business fields', () => {
    const result = generateBusinessProfileText({
      id: 'b1',
      year: 2025,
      createdAt: '',
      updatedAt: '',
      payload: {
        businessName: 'Acme LLC',
        ein: '12-3456789',
        entityType: 'LLC',
        accountingMethod: 'Cash',
        homeOfficePercent: 15,
        address: '456 Oak Ave',
        city: 'Portland',
        state: 'OR',
        zip: '97201',
        notes: 'Test notes',
      },
    });
    expect(result).toContain('Business Name: Acme LLC');
    expect(result).toContain('EIN: 12-3456789');
    expect(result).toContain('Entity Type: LLC');
    expect(result).toContain('Accounting Method: Cash');
    expect(result).toContain('Home Office %: 15%');
    expect(result).toContain('Address: 456 Oak Ave');
    expect(result).toContain('Portland, OR, 97201');
    expect(result).toContain('Notes: Test notes');
  });
});

// ─── exportUtilityBillsCsv ──────────────────────────────────

describe('exportUtilityBillsCsv', () => {
  it('produces correct CSV headers and rows', async () => {
    mockListUtilityBills.mockResolvedValue([
      {
        id: 'u1',
        year: 2025,
        utilityType: 'Electric',
        billDate: '2025-01-15',
        amount: 15000,
        createdAt: '',
        updatedAt: '',
        payload: {
          provider: 'Power Co',
          usage: 450,
          usageUnit: 'kWh',
          consumptionCharges: 12000,
          otherCharges: 3000,
          notes: 'January bill',
        },
      },
    ]);

    const csv = await exportUtilityBillsCsv(2025);
    const lines = csv.trim().split('\n');

    expect(lines[0]).toBe(
      'Bill Date,Utility Type,Amount,Provider,Usage,Usage Unit,Consumption Charges,Other Charges,Notes'
    );
    expect(lines[1]).toContain('2025-01-15');
    expect(lines[1]).toContain('Electric');
    expect(lines[1]).toContain('Power Co');
    expect(lines[1]).toContain('450');
    expect(lines[1]).toContain('kWh');
    expect(lines[1]).toContain('January bill');
  });

  it('returns headers-only for empty data', async () => {
    mockListUtilityBills.mockResolvedValue([]);
    const csv = await exportUtilityBillsCsv(2025);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Bill Date');
  });
});

// ─── exportEstimatedPaymentsCsv ──────────────────────────────

describe('exportEstimatedPaymentsCsv', () => {
  it('produces correct CSV headers and rows', async () => {
    mockListEstimatedPayments.mockResolvedValue([
      {
        id: 'ep1',
        year: 2025,
        quarter: 1,
        dueDate: '2025-04-15',
        amountDue: 250000,
        amountPaid: 250000,
        datePaid: '2025-04-10',
        createdAt: '',
        updatedAt: '',
        payload: {
          confirmationNumber: 'CONF-123',
          paymentMethod: 'Direct Pay',
          notes: 'Q1 payment',
        },
      },
    ]);

    const csv = await exportEstimatedPaymentsCsv(2025);
    const lines = csv.trim().split('\n');

    expect(lines[0]).toBe(
      'Quarter,Due Date,Amount Due,Amount Paid,Date Paid,Confirmation Number,Payment Method,Notes'
    );
    expect(lines[1]).toContain('Q1');
    expect(lines[1]).toContain('2025-04-15');
    expect(lines[1]).toContain('CONF-123');
    expect(lines[1]).toContain('Direct Pay');
    expect(lines[1]).toContain('Q1 payment');
  });

  it('handles null payload gracefully', async () => {
    mockListEstimatedPayments.mockResolvedValue([
      {
        id: 'ep2',
        year: 2025,
        quarter: 2,
        dueDate: '2025-06-15',
        amountDue: 100000,
        amountPaid: 0,
        datePaid: null,
        createdAt: '',
        updatedAt: '',
        payload: null,
      },
    ]);

    const csv = await exportEstimatedPaymentsCsv(2025);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Q2');
  });
});
