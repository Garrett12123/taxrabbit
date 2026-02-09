import 'server-only';

import archiver from 'archiver';

import { objectsToCSV } from '@/lib/csv/generate';
import { listExpensesByYear, type ExpenseDecrypted } from '@/server/db/dal/expenses';
import { listIncomeDocumentsByYear, type IncomeDocumentDecrypted } from '@/server/db/dal/income-documents';
import { listMileageLogsByYear, type MileageLogDecrypted } from '@/server/db/dal/mileage-logs';
import { formatCents } from '@/lib/utils';

// ─── Expenses Export ────────────────────────────────────────────

const EXPENSE_EXPORT_COLUMNS = [
  { key: 'date', header: 'Date' },
  { key: 'vendor', header: 'Vendor' },
  { key: 'amount', header: 'Amount' },
  { key: 'category', header: 'Category' },
  { key: 'entityType', header: 'Entity Type' },
  { key: 'description', header: 'Description' },
  { key: 'notes', header: 'Notes' },
  { key: 'paymentMethod', header: 'Payment Method' },
];

export async function exportExpensesCsv(year: number): Promise<string> {
  const expenses = await listExpensesByYear(year);

  return objectsToCSV(EXPENSE_EXPORT_COLUMNS, expenses, (expense: ExpenseDecrypted) => ({
    date: expense.date,
    vendor: expense.payload?.vendor ?? '',
    amount: formatCents(expense.amount),
    category: expense.category,
    entityType: expense.entityType,
    description: expense.payload?.description ?? '',
    notes: expense.payload?.notes ?? '',
    paymentMethod: expense.payload?.paymentMethod ?? '',
  }));
}

// ─── Income Export ────────────────────────────────────────────

const INCOME_EXPORT_COLUMNS = [
  { key: 'formType', header: 'Form Type' },
  { key: 'entityType', header: 'Entity Type' },
  { key: 'issuerName', header: 'Issuer Name' },
  { key: 'issuerEin', header: 'Issuer EIN' },
  { key: 'amount', header: 'Amount' },
  { key: 'fedWithholding', header: 'Fed Withholding' },
  { key: 'stateWithholding', header: 'State Withholding' },
  { key: 'incomeDate', header: 'Income Date' },
  { key: 'notes', header: 'Notes' },
];

export async function exportIncomeCsv(year: number): Promise<string> {
  const documents = await listIncomeDocumentsByYear(year);

  return objectsToCSV(INCOME_EXPORT_COLUMNS, documents, (doc: IncomeDocumentDecrypted) => ({
    formType: doc.formType,
    entityType: doc.entityType,
    issuerName: doc.payload?.issuerName ?? '',
    issuerEin: doc.payload?.issuerEin ?? '',
    amount: formatCents(doc.amount),
    fedWithholding: formatCents(doc.fedWithholding),
    stateWithholding: formatCents(doc.stateWithholding),
    incomeDate: doc.incomeDate ?? '',
    notes: doc.payload?.notes ?? '',
  }));
}

// ─── Mileage Export ────────────────────────────────────────────

const MILEAGE_EXPORT_COLUMNS = [
  { key: 'date', header: 'Date' },
  { key: 'miles', header: 'Miles' },
  { key: 'purpose', header: 'Purpose' },
  { key: 'destination', header: 'Destination' },
  { key: 'isRoundTrip', header: 'Round Trip' },
  { key: 'notes', header: 'Notes' },
];

export async function exportMileageCsv(year: number): Promise<string> {
  const logs = await listMileageLogsByYear(year);

  return objectsToCSV(MILEAGE_EXPORT_COLUMNS, logs, (log: MileageLogDecrypted) => {
    // If round trip, the stored miles are already doubled - export the one-way miles
    // so re-importing with isRoundTrip=true will correctly double them again
    const storedMiles = log.miles / 100;
    const exportMiles = log.payload?.isRoundTrip ? storedMiles / 2 : storedMiles;
    
    return {
      date: log.date,
      miles: exportMiles.toFixed(2),
      purpose: log.payload?.purpose ?? '',
      destination: log.payload?.destination ?? '',
      isRoundTrip: log.payload?.isRoundTrip ? 'Yes' : 'No',
      notes: log.payload?.notes ?? '',
    };
  });
}

// ─── CPA Packet Export ────────────────────────────────────────────

type CPAPacketOptions = {
  year: number;
  includeDocuments?: boolean;
};

export async function generateCPAPacket(
  options: CPAPacketOptions
): Promise<{ buffer: Buffer; filename: string }> {
  const { year } = options;

  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  const archivePromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  // Add CSV exports
  const [expensesCsv, incomeCsv, mileageCsv] = await Promise.all([
    exportExpensesCsv(year),
    exportIncomeCsv(year),
    exportMileageCsv(year),
  ]);

  archive.append(expensesCsv, { name: `cpa-packet-${year}/expenses.csv` });
  archive.append(incomeCsv, { name: `cpa-packet-${year}/income.csv` });
  archive.append(mileageCsv, { name: `cpa-packet-${year}/mileage.csv` });

  // Add a summary file
  const summary = `TaxRabbit CPA Packet
Tax Year: ${year}
Generated: ${new Date().toISOString()}

This packet contains:
- expenses.csv: All business and personal expenses
- income.csv: All income documents (W-2, 1099, etc.)
- mileage.csv: Business mileage logs
`;
  archive.append(summary, { name: `cpa-packet-${year}/README.txt` });

  archive.finalize();

  const buffer = await archivePromise;
  const filename = `taxrabbit-cpa-packet-${year}.zip`;

  return { buffer, filename };
}
