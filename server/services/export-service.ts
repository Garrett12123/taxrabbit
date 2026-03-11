import 'server-only';

import archiver from 'archiver';
import { extname } from 'node:path';

import { objectsToCSV } from '@/lib/csv/generate';
import { formatCents } from '@/lib/utils';
import { generateXlsx } from '@/lib/export/xlsx-generator';
import { generatePdf } from '@/lib/export/pdf-generator';
import { generateDocx } from '@/lib/export/docx-generator';
import { listExpensesByYear, type ExpenseDecrypted } from '@/server/db/dal/expenses';
import { listIncomeDocumentsByYear, type IncomeDocumentDecrypted } from '@/server/db/dal/income-documents';
import { listMileageLogsByYear, type MileageLogDecrypted } from '@/server/db/dal/mileage-logs';
import { listUtilityBillsByYear, type UtilityBillDecrypted } from '@/server/db/dal/utility-bills';
import {
  listEstimatedPaymentsByYear,
  type EstimatedPaymentDecrypted,
} from '@/server/db/dal/estimated-payments';
import { listPersonProfilesByYear, type PersonProfileDecrypted } from '@/server/db/dal/person-profiles';
import {
  getBusinessProfileForYear,
  type BusinessProfileDecrypted,
} from '@/server/services/business-service';
import { listDocumentFilesByYear } from '@/server/db/dal/document-files';
import { readVaultFile } from '@/server/storage/vault';
import { requireDek } from '@/server/security/session';
import { getYearEndSummary } from '@/server/services/report-service';
import { estimateTaxLiability } from '@/server/services/tax-estimator-service';

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

// ─── Utility Bills Export ────────────────────────────────────────

const UTILITY_EXPORT_COLUMNS = [
  { key: 'billDate', header: 'Bill Date' },
  { key: 'utilityType', header: 'Utility Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'provider', header: 'Provider' },
  { key: 'usage', header: 'Usage' },
  { key: 'usageUnit', header: 'Usage Unit' },
  { key: 'consumptionCharges', header: 'Consumption Charges' },
  { key: 'otherCharges', header: 'Other Charges' },
  { key: 'notes', header: 'Notes' },
];

export async function exportUtilityBillsCsv(year: number): Promise<string> {
  const bills = await listUtilityBillsByYear(year);

  return objectsToCSV(UTILITY_EXPORT_COLUMNS, bills, (bill: UtilityBillDecrypted) => ({
    billDate: bill.billDate,
    utilityType: bill.utilityType,
    amount: formatCents(bill.amount),
    provider: bill.payload?.provider ?? '',
    usage: bill.payload?.usage != null ? String(bill.payload.usage) : '',
    usageUnit: bill.payload?.usageUnit ?? '',
    consumptionCharges: bill.payload?.consumptionCharges != null
      ? formatCents(bill.payload.consumptionCharges)
      : '',
    otherCharges: bill.payload?.otherCharges != null
      ? formatCents(bill.payload.otherCharges)
      : '',
    notes: bill.payload?.notes ?? '',
  }));
}

// ─── Estimated Payments Export ────────────────────────────────────

const ESTIMATED_PAYMENTS_EXPORT_COLUMNS = [
  { key: 'quarter', header: 'Quarter' },
  { key: 'dueDate', header: 'Due Date' },
  { key: 'amountDue', header: 'Amount Due' },
  { key: 'amountPaid', header: 'Amount Paid' },
  { key: 'datePaid', header: 'Date Paid' },
  { key: 'confirmationNumber', header: 'Confirmation Number' },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'notes', header: 'Notes' },
];

export async function exportEstimatedPaymentsCsv(year: number): Promise<string> {
  const payments = await listEstimatedPaymentsByYear(year);

  return objectsToCSV(
    ESTIMATED_PAYMENTS_EXPORT_COLUMNS,
    payments,
    (payment: EstimatedPaymentDecrypted) => ({
      quarter: `Q${payment.quarter}`,
      dueDate: payment.dueDate,
      amountDue: formatCents(payment.amountDue),
      amountPaid: formatCents(payment.amountPaid),
      datePaid: payment.datePaid ?? '',
      confirmationNumber: payment.payload?.confirmationNumber ?? '',
      paymentMethod: payment.payload?.paymentMethod ?? '',
      notes: payment.payload?.notes ?? '',
    })
  );
}

// ─── Helpers ────────────────────────────────────────────────────

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // replace unsafe chars
    .replace(/_+/g, '_') // collapse consecutive underscores
    .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
    .slice(0, 100) || 'unnamed';
}

export function insertCounterBeforeExt(filename: string, counter: number): string {
  const ext = extname(filename);
  const base = filename.slice(0, filename.length - ext.length);
  return `${base}-${counter}${ext}`;
}

export function generatePersonProfileText(profiles: PersonProfileDecrypted[]): string {
  if (profiles.length === 0) return 'No taxpayer profiles recorded.\n';

  return profiles
    .map((p) => {
      const lines: string[] = [];
      lines.push(`--- ${p.label || 'Taxpayer'} ---`);
      lines.push(`Name: ${p.payload.firstName} ${p.payload.lastName}`);
      if (p.payload.ssn) {
        const masked = p.payload.ssn.length >= 4
          ? `***-**-${p.payload.ssn.slice(-4)}`
          : '***-**-****';
        lines.push(`SSN: ${masked}`);
      }
      if (p.payload.dateOfBirth) lines.push(`Date of Birth: ${p.payload.dateOfBirth}`);
      const addrParts = [p.payload.address, p.payload.address2].filter(Boolean);
      if (addrParts.length) lines.push(`Address: ${addrParts.join(', ')}`);
      const cityStateZip = [
        p.payload.city,
        p.payload.state,
        p.payload.zip,
      ].filter(Boolean).join(', ');
      if (cityStateZip) lines.push(`         ${cityStateZip}`);
      if (p.payload.phone) lines.push(`Phone: ${p.payload.phone}`);
      if (p.payload.email) lines.push(`Email: ${p.payload.email}`);
      return lines.join('\n');
    })
    .join('\n\n') + '\n';
}

export function generateBusinessProfileText(profile: BusinessProfileDecrypted | null): string {
  if (!profile) return 'No business profile recorded.\n';

  const p = profile.payload;
  const lines: string[] = [];
  lines.push(`Business Name: ${p.businessName}`);
  if (p.ein) lines.push(`EIN: ${p.ein}`);
  if (p.entityType) lines.push(`Entity Type: ${p.entityType}`);
  if (p.accountingMethod) lines.push(`Accounting Method: ${p.accountingMethod}`);
  if (p.stateOfFormation) lines.push(`State of Formation: ${p.stateOfFormation}`);
  if (p.startDate) lines.push(`Start Date: ${p.startDate}`);
  const addrParts = [p.address, p.address2].filter(Boolean);
  if (addrParts.length) lines.push(`Address: ${addrParts.join(', ')}`);
  const cityStateZip = [p.city, p.state, p.zip].filter(Boolean).join(', ');
  if (cityStateZip) lines.push(`         ${cityStateZip}`);
  if (p.homeOfficePercent != null) lines.push(`Home Office %: ${p.homeOfficePercent}%`);
  if (p.notes) lines.push(`Notes: ${p.notes}`);

  return lines.join('\n') + '\n';
}


// ─── CPA Packet Export ────────────────────────────────────────────

type CPAPacketOptions = {
  year: number;
  includeDocuments?: boolean;
};

export async function generateCPAPacket(
  options: CPAPacketOptions
): Promise<{ buffer: Buffer; filename: string }> {
  const { year, includeDocuments = false } = options;

  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  const archivePromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  const prefix = `Tax Records - ${year}`;

  // 1. Parallel fetch all data
  const [
    expenses,
    income,
    mileage,
    utilities,
    estimatedPayments,
    summaryData,
    taxEstimate,
    personProfiles,
    businessProfile,
  ] = await Promise.all([
    listExpensesByYear(year),
    listIncomeDocumentsByYear(year),
    listMileageLogsByYear(year),
    listUtilityBillsByYear(year),
    listEstimatedPaymentsByYear(year),
    getYearEndSummary(year),
    estimateTaxLiability(year),
    listPersonProfilesByYear(year),
    getBusinessProfileForYear(year),
  ]);

  // 2. Generate formatted files in parallel
  const [xlsxBuffer, pdfBuffer, docxBuffer] = await Promise.all([
    generateXlsx({
      year,
      summary: summaryData,
      taxEstimate,
      expenses,
      income,
      mileage,
      utilities,
      estimatedPayments,
    }),
    generatePdf({
      year,
      summary: summaryData,
      taxEstimate,
      personProfiles,
      businessProfile,
    }),
    generateDocx({
      year,
      summary: summaryData,
      taxEstimate,
      personProfiles,
      businessProfile,
      includeDocuments,
      documentCount: 0, // updated below if documents included
    }),
  ]);

  // 3. Main formatted files
  archive.append(pdfBuffer, { name: `${prefix}/Tax Summary ${year}.pdf` });
  archive.append(xlsxBuffer, { name: `${prefix}/Financial Data ${year}.xlsx` });

  // 4. Raw CSVs — only include sections that have data
  if (expenses.length > 0) {
    archive.append(await exportExpensesCsv(year), { name: `${prefix}/data/expenses.csv` });
  }
  if (income.length > 0) {
    archive.append(await exportIncomeCsv(year), { name: `${prefix}/data/income.csv` });
  }
  if (mileage.length > 0) {
    archive.append(await exportMileageCsv(year), { name: `${prefix}/data/mileage.csv` });
  }
  if (utilities.length > 0) {
    archive.append(await exportUtilityBillsCsv(year), { name: `${prefix}/data/utility-bills.csv` });
  }
  if (estimatedPayments.length > 0) {
    archive.append(await exportEstimatedPaymentsCsv(year), { name: `${prefix}/data/estimated-payments.csv` });
  }

  // 5. Documents (when checkbox is checked)
  let documentCount = 0;

  if (includeDocuments) {
    const dek = await requireDek();
    const [allDocs, incomeDocs] = await Promise.all([
      listDocumentFilesByYear(year),
      listIncomeDocumentsByYear(year),
    ]);

    const incomeDocMap = new Map<string, IncomeDocumentDecrypted>();
    for (const doc of incomeDocs) {
      incomeDocMap.set(doc.id, doc);
    }

    const usedNames = new Map<string, Set<string>>();

    for (const doc of allDocs) {
      let folder: string;
      let filePrefix = '';
      if (doc.linkedEntityType === 'income' && doc.linkedEntityId) {
        folder = 'documents/income';
        const incomeDoc = incomeDocMap.get(doc.linkedEntityId);
        if (incomeDoc) {
          const issuer = incomeDoc.payload?.issuerName ?? '';
          filePrefix = `${incomeDoc.formType}-${sanitizeFilename(issuer)}-`;
        }
      } else if (doc.linkedEntityType === 'expense') {
        folder = 'documents/expenses';
      } else {
        folder = 'documents/other';
      }

      const originalFilename = doc.payload?.originalFilename ?? `document-${doc.id}`;
      let filename = filePrefix + sanitizeFilename(originalFilename);

      if (!extname(filename) && extname(originalFilename)) {
        filename += extname(originalFilename);
      }

      if (!usedNames.has(folder)) {
        usedNames.set(folder, new Set());
      }
      const folderNames = usedNames.get(folder)!;
      let counter = 0;
      let deduped = filename;
      while (folderNames.has(deduped)) {
        counter++;
        deduped = insertCounterBeforeExt(filename, counter);
      }
      folderNames.add(deduped);

      try {
        const content = readVaultFile(doc.id, dek);
        archive.append(content, { name: `${prefix}/${folder}/${deduped}` });
        documentCount++;
      } catch {
        // Document could not be read — skip it
      }
    }
  }

  // 6. Re-generate DOCX with actual document count, then add cover letter
  const finalDocx = documentCount > 0
    ? await generateDocx({
        year,
        summary: summaryData,
        taxEstimate,
        personProfiles,
        businessProfile,
        includeDocuments,
        documentCount,
      })
    : docxBuffer;
  archive.append(finalDocx, { name: `${prefix}/Overview ${year}.docx` });

  // 7. Finalize
  archive.finalize();

  const buffer = await archivePromise;
  const filename = `tax-records-${year}.zip`;

  return { buffer, filename };
}
