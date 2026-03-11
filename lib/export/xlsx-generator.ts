import ExcelJS from 'exceljs';
import type { SummaryData } from '@/lib/html/summary-template';
import type { TaxEstimate } from '@/server/services/tax-estimator-service';
import type { ExpenseDecrypted } from '@/server/db/dal/expenses';
import type { IncomeDocumentDecrypted } from '@/server/db/dal/income-documents';
import type { MileageLogDecrypted } from '@/server/db/dal/mileage-logs';
import type { UtilityBillDecrypted } from '@/server/db/dal/utility-bills';
import type { EstimatedPaymentDecrypted } from '@/server/db/dal/estimated-payments';

// ─── Styling constants ──────────────────────────────────────────

const BRAND_COLOR = '1B5E20';  // dark green
const HEADER_BG = '1B5E20';
const HEADER_FONT = 'FFFFFF';
const TOTAL_BG = 'E8F5E9';
const LIGHT_STRIPE = 'F9FBF9';

const CURRENCY_FMT = '"$"#,##0.00';

function headerFill(): ExcelJS.FillPattern {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
}

function headerFont(): Partial<ExcelJS.Font> {
  return { bold: true, color: { argb: HEADER_FONT }, size: 11 };
}

function totalFill(): ExcelJS.FillPattern {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
}

function stripeFill(): ExcelJS.FillPattern {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_STRIPE } };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'D0D0D0' } };
  return { top: side, bottom: side, left: side, right: side };
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = headerFill();
    cell.font = headerFont();
    cell.border = thinBorder();
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 24;
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = totalFill();
    cell.font = { bold: true, size: 11 };
    cell.border = thinBorder();
  });
}

function styleDataRows(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let r = startRow; r <= endRow; r++) {
    const row = sheet.getRow(r);
    row.eachCell((cell) => {
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle' };
    });
    if ((r - startRow) % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = stripeFill();
      });
    }
  }
}

function autoWidth(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value?.toString().length ?? 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 4, 40);
  });
}

function centsToDollars(cents: number): number {
  return cents / 100;
}

// ─── Types ──────────────────────────────────────────────────────

export type XlsxData = {
  year: number;
  summary: SummaryData;
  taxEstimate: TaxEstimate;
  expenses: ExpenseDecrypted[];
  income: IncomeDocumentDecrypted[];
  mileage: MileageLogDecrypted[];
  utilities: UtilityBillDecrypted[];
  estimatedPayments: EstimatedPaymentDecrypted[];
};

// ─── Workbook generator ─────────────────────────────────────────

export async function generateXlsx(data: XlsxData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TaxRabbit';
  wb.created = new Date();

  buildSummarySheet(wb, data);
  buildIncomeSheet(wb, data.income);
  buildExpensesSheet(wb, data.expenses);
  buildMileageSheet(wb, data.mileage);
  buildUtilitiesSheet(wb, data.utilities);
  buildEstPaymentsSheet(wb, data.estimatedPayments);
  buildTaxEstimateSheet(wb, data.taxEstimate, data.year);

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Summary Sheet ──────────────────────────────────────────────

function buildSummarySheet(wb: ExcelJS.Workbook, data: XlsxData) {
  const ws = wb.addWorksheet('Summary', { properties: { tabColor: { argb: BRAND_COLOR } } });

  // Title
  ws.mergeCells('A1:D1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `TaxRabbit — Tax Year ${data.year} Summary`;
  titleCell.font = { bold: true, size: 16, color: { argb: BRAND_COLOR } };
  titleCell.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 30;

  ws.mergeCells('A2:D2');
  ws.getCell('A2').value = `Generated ${data.summary.generatedAt}`;
  ws.getCell('A2').font = { size: 10, color: { argb: '888888' } };

  // Overview KPIs
  let row = 4;
  const kpis: [string, number][] = [
    ['Total Income', data.summary.income.total],
    ['Federal Withholding', data.summary.income.totalWithholding],
    ['Total Expenses', data.summary.expenses.totalAll],
    ['Business Expenses', data.summary.expenses.totalBusiness],
  ];

  if (data.summary.mileage && data.summary.mileage.totalTrips > 0) {
    kpis.push(['Mileage Deduction', data.summary.mileage.totalDeduction]);
  }
  if (data.summary.utilityBills && data.summary.utilityBills.byType.length > 0) {
    kpis.push(['Utility Deduction', data.summary.utilityBills.businessDeduction]);
  }

  for (const [label, cents] of kpis) {
    const r = ws.getRow(row);
    r.getCell(1).value = label;
    r.getCell(1).font = { bold: true, size: 11 };
    r.getCell(2).value = centsToDollars(cents);
    r.getCell(2).numFmt = CURRENCY_FMT;
    r.getCell(2).font = { size: 11 };
    row++;
  }

  // Income by type table
  row += 2;
  ws.getCell(`A${row}`).value = 'Income by Form Type';
  ws.getCell(`A${row}`).font = { bold: true, size: 13, color: { argb: BRAND_COLOR } };
  row++;

  const incHeaders = ws.getRow(row);
  incHeaders.values = ['Form Type', 'Count', 'Amount'];
  styleHeaderRow(incHeaders);
  row++;

  const incStart = row;
  for (const t of data.summary.income.byType) {
    const r = ws.getRow(row);
    r.getCell(1).value = t.formType;
    r.getCell(2).value = t.count;
    r.getCell(3).value = centsToDollars(t.totalAmount);
    r.getCell(3).numFmt = CURRENCY_FMT;
    row++;
  }
  styleDataRows(ws, incStart, row - 1);

  const totalRow = ws.getRow(row);
  totalRow.getCell(1).value = 'Total';
  totalRow.getCell(2).value = data.summary.income.byType.reduce((s, r) => s + r.count, 0);
  totalRow.getCell(3).value = centsToDollars(data.summary.income.total);
  totalRow.getCell(3).numFmt = CURRENCY_FMT;
  styleTotalRow(totalRow);

  // Expenses by category
  const businessExpenses = data.summary.expenses.byCategory.filter((c) => c.entityType === 'business');
  const personalExpenses = data.summary.expenses.byCategory.filter(
    (c) => !c.entityType || c.entityType === 'personal'
  );

  row += 3;
  for (const [label, items, total] of [
    ['Business Expenses by Category', businessExpenses, data.summary.expenses.totalBusiness] as const,
    ['Personal Expenses by Category', personalExpenses, data.summary.expenses.totalPersonal] as const,
  ]) {
    if (items.length === 0) continue;

    ws.getCell(`A${row}`).value = label;
    ws.getCell(`A${row}`).font = { bold: true, size: 13, color: { argb: BRAND_COLOR } };
    row++;

    const hdr = ws.getRow(row);
    hdr.values = ['Category', 'Count', 'Amount'];
    styleHeaderRow(hdr);
    row++;

    const ds = row;
    for (const c of items) {
      const r = ws.getRow(row);
      r.getCell(1).value = c.category;
      r.getCell(2).value = c.count;
      r.getCell(3).value = centsToDollars(c.total);
      r.getCell(3).numFmt = CURRENCY_FMT;
      row++;
    }
    styleDataRows(ws, ds, row - 1);

    const tr = ws.getRow(row);
    tr.getCell(1).value = 'Total';
    tr.getCell(3).value = centsToDollars(total);
    tr.getCell(3).numFmt = CURRENCY_FMT;
    styleTotalRow(tr);
    row += 3;
  }

  autoWidth(ws);
  ws.getColumn(1).width = 30;
}

// ─── Income Sheet ───────────────────────────────────────────────

function buildIncomeSheet(wb: ExcelJS.Workbook, income: IncomeDocumentDecrypted[]) {
  const ws = wb.addWorksheet('Income');

  const headers = ['Form Type', 'Entity Type', 'Issuer Name', 'Issuer EIN', 'Amount', 'Fed Withholding', 'State Withholding', 'Income Date', 'Notes'];
  const hdr = ws.getRow(1);
  hdr.values = headers;
  styleHeaderRow(hdr);

  let row = 2;
  for (const doc of income) {
    const r = ws.getRow(row);
    r.values = [
      doc.formType,
      doc.entityType,
      doc.payload?.issuerName ?? '',
      doc.payload?.issuerEin ?? '',
      centsToDollars(doc.amount),
      centsToDollars(doc.fedWithholding),
      centsToDollars(doc.stateWithholding),
      doc.incomeDate ?? '',
      doc.payload?.notes ?? '',
    ];
    r.getCell(5).numFmt = CURRENCY_FMT;
    r.getCell(6).numFmt = CURRENCY_FMT;
    r.getCell(7).numFmt = CURRENCY_FMT;
    row++;
  }
  styleDataRows(ws, 2, row - 1);

  // Totals
  if (income.length > 0) {
    const tr = ws.getRow(row);
    tr.getCell(1).value = 'Total';
    tr.getCell(5).value = centsToDollars(income.reduce((s, d) => s + d.amount, 0));
    tr.getCell(5).numFmt = CURRENCY_FMT;
    tr.getCell(6).value = centsToDollars(income.reduce((s, d) => s + d.fedWithholding, 0));
    tr.getCell(6).numFmt = CURRENCY_FMT;
    tr.getCell(7).value = centsToDollars(income.reduce((s, d) => s + d.stateWithholding, 0));
    tr.getCell(7).numFmt = CURRENCY_FMT;
    styleTotalRow(tr);
  }

  autoWidth(ws);
  ws.autoFilter = { from: 'A1', to: `I${row}` };
}

// ─── Expenses Sheet ─────────────────────────────────────────────

function buildExpensesSheet(wb: ExcelJS.Workbook, expenses: ExpenseDecrypted[]) {
  const ws = wb.addWorksheet('Expenses');

  const headers = ['Date', 'Vendor', 'Amount', 'Category', 'Entity Type', 'Description', 'Notes', 'Payment Method'];
  const hdr = ws.getRow(1);
  hdr.values = headers;
  styleHeaderRow(hdr);

  let row = 2;
  for (const exp of expenses) {
    const r = ws.getRow(row);
    r.values = [
      exp.date,
      exp.payload?.vendor ?? '',
      centsToDollars(exp.amount),
      exp.category,
      exp.entityType,
      exp.payload?.description ?? '',
      exp.payload?.notes ?? '',
      exp.payload?.paymentMethod ?? '',
    ];
    r.getCell(3).numFmt = CURRENCY_FMT;
    row++;
  }
  styleDataRows(ws, 2, row - 1);

  if (expenses.length > 0) {
    const tr = ws.getRow(row);
    tr.getCell(1).value = 'Total';
    tr.getCell(3).value = centsToDollars(expenses.reduce((s, e) => s + e.amount, 0));
    tr.getCell(3).numFmt = CURRENCY_FMT;
    styleTotalRow(tr);
  }

  autoWidth(ws);
  ws.autoFilter = { from: 'A1', to: `H${row}` };
}

// ─── Mileage Sheet ──────────────────────────────────────────────

function buildMileageSheet(wb: ExcelJS.Workbook, mileage: MileageLogDecrypted[]) {
  const ws = wb.addWorksheet('Mileage');

  const headers = ['Date', 'Miles', 'Purpose', 'Destination', 'Round Trip', 'Notes'];
  const hdr = ws.getRow(1);
  hdr.values = headers;
  styleHeaderRow(hdr);

  let row = 2;
  for (const log of mileage) {
    const storedMiles = log.miles / 100;
    const exportMiles = log.payload?.isRoundTrip ? storedMiles / 2 : storedMiles;

    const r = ws.getRow(row);
    r.values = [
      log.date,
      exportMiles,
      log.payload?.purpose ?? '',
      log.payload?.destination ?? '',
      log.payload?.isRoundTrip ? 'Yes' : 'No',
      log.payload?.notes ?? '',
    ];
    r.getCell(2).numFmt = '#,##0.00';
    row++;
  }
  styleDataRows(ws, 2, row - 1);

  if (mileage.length > 0) {
    const tr = ws.getRow(row);
    tr.getCell(1).value = 'Total';
    const totalMiles = mileage.reduce((s, l) => s + l.miles, 0) / 100;
    tr.getCell(2).value = totalMiles;
    tr.getCell(2).numFmt = '#,##0.00';
    styleTotalRow(tr);
  }

  autoWidth(ws);
  ws.autoFilter = { from: 'A1', to: `F${row}` };
}

// ─── Utilities Sheet ────────────────────────────────────────────

function buildUtilitiesSheet(wb: ExcelJS.Workbook, utilities: UtilityBillDecrypted[]) {
  const ws = wb.addWorksheet('Utility Bills');

  const headers = ['Bill Date', 'Utility Type', 'Amount', 'Provider', 'Usage', 'Usage Unit', 'Consumption Charges', 'Other Charges', 'Notes'];
  const hdr = ws.getRow(1);
  hdr.values = headers;
  styleHeaderRow(hdr);

  let row = 2;
  for (const bill of utilities) {
    const r = ws.getRow(row);
    r.values = [
      bill.billDate,
      bill.utilityType,
      centsToDollars(bill.amount),
      bill.payload?.provider ?? '',
      bill.payload?.usage ?? '',
      bill.payload?.usageUnit ?? '',
      bill.payload?.consumptionCharges != null ? centsToDollars(bill.payload.consumptionCharges) : '',
      bill.payload?.otherCharges != null ? centsToDollars(bill.payload.otherCharges) : '',
      bill.payload?.notes ?? '',
    ];
    r.getCell(3).numFmt = CURRENCY_FMT;
    if (r.getCell(7).value !== '') r.getCell(7).numFmt = CURRENCY_FMT;
    if (r.getCell(8).value !== '') r.getCell(8).numFmt = CURRENCY_FMT;
    row++;
  }
  styleDataRows(ws, 2, row - 1);

  if (utilities.length > 0) {
    const tr = ws.getRow(row);
    tr.getCell(1).value = 'Total';
    tr.getCell(3).value = centsToDollars(utilities.reduce((s, b) => s + b.amount, 0));
    tr.getCell(3).numFmt = CURRENCY_FMT;
    styleTotalRow(tr);
  }

  autoWidth(ws);
  ws.autoFilter = { from: 'A1', to: `I${row}` };
}

// ─── Estimated Payments Sheet ───────────────────────────────────

function buildEstPaymentsSheet(wb: ExcelJS.Workbook, payments: EstimatedPaymentDecrypted[]) {
  const ws = wb.addWorksheet('Estimated Payments');

  const headers = ['Quarter', 'Due Date', 'Amount Due', 'Amount Paid', 'Date Paid', 'Confirmation #', 'Payment Method', 'Notes'];
  const hdr = ws.getRow(1);
  hdr.values = headers;
  styleHeaderRow(hdr);

  let row = 2;
  for (const p of payments) {
    const r = ws.getRow(row);
    r.values = [
      `Q${p.quarter}`,
      p.dueDate,
      centsToDollars(p.amountDue),
      centsToDollars(p.amountPaid),
      p.datePaid ?? '',
      p.payload?.confirmationNumber ?? '',
      p.payload?.paymentMethod ?? '',
      p.payload?.notes ?? '',
    ];
    r.getCell(3).numFmt = CURRENCY_FMT;
    r.getCell(4).numFmt = CURRENCY_FMT;
    row++;
  }
  styleDataRows(ws, 2, row - 1);

  if (payments.length > 0) {
    const tr = ws.getRow(row);
    tr.getCell(1).value = 'Total';
    tr.getCell(3).value = centsToDollars(payments.reduce((s, p) => s + p.amountDue, 0));
    tr.getCell(3).numFmt = CURRENCY_FMT;
    tr.getCell(4).value = centsToDollars(payments.reduce((s, p) => s + p.amountPaid, 0));
    tr.getCell(4).numFmt = CURRENCY_FMT;
    styleTotalRow(tr);
  }

  autoWidth(ws);
}

// ─── Tax Estimate Sheet ─────────────────────────────────────────

function buildTaxEstimateSheet(wb: ExcelJS.Workbook, est: TaxEstimate, year: number) {
  const ws = wb.addWorksheet('Tax Estimate', { properties: { tabColor: { argb: 'FF6F00' } } });

  ws.mergeCells('A1:B1');
  ws.getCell('A1').value = `Tax Year ${year} — Federal Tax Estimate`;
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: BRAND_COLOR } };
  ws.getRow(1).height = 28;

  const isRefund = est.estimatedOwed < 0;
  ws.getCell('A3').value = isRefund ? 'Estimated Refund' : 'Estimated Tax Owed';
  ws.getCell('A3').font = { bold: true, size: 13 };
  ws.getCell('B3').value = centsToDollars(Math.abs(est.estimatedOwed));
  ws.getCell('B3').numFmt = CURRENCY_FMT;
  ws.getCell('B3').font = { bold: true, size: 13, color: { argb: isRefund ? '16A34A' : 'DC2626' } };

  const sections: [string, [string, number | string][]][] = [
    ['Income', [
      ['Gross Income', centsToDollars(est.grossIncome)],
      ['Self-Employment Income', centsToDollars(est.selfEmploymentIncome)],
    ]],
    ['Deductions', [
      ['Business Expenses', centsToDollars(est.businessExpenses)],
      ['Mileage Deduction', centsToDollars(est.mileageDeduction)],
      ['Utility Deduction (Home Office)', centsToDollars(est.utilityDeduction)],
      ['Standard Deduction', centsToDollars(est.standardDeduction)],
      ['Taxable Income', centsToDollars(est.taxableIncome)],
    ]],
    ['Taxes', [
      ['Federal Income Tax', centsToDollars(est.federalIncomeTax)],
      ['Self-Employment Tax', centsToDollars(est.selfEmploymentTax)],
      ...(est.additionalMedicareTax > 0
        ? [['Additional Medicare Tax', centsToDollars(est.additionalMedicareTax)] as [string, number]]
        : []),
      ['Total Tax', centsToDollars(est.totalTax)],
    ]],
    ['Withholding', [
      ['Total Withholding', centsToDollars(est.totalWithholding)],
      ['State Withholding', centsToDollars(est.stateWithholding)],
    ]],
    ['Rates', [
      ['Effective Rate', `${est.effectiveRate}%`],
      ['Marginal Rate', `${est.marginalRate}%`],
    ]],
  ];

  let row = 5;
  for (const [sectionTitle, items] of sections) {
    ws.getCell(`A${row}`).value = sectionTitle;
    ws.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: BRAND_COLOR } };
    row++;

    for (const [label, value] of items) {
      ws.getCell(`A${row}`).value = label;
      ws.getCell(`B${row}`).value = value;
      if (typeof value === 'number') {
        ws.getCell(`B${row}`).numFmt = CURRENCY_FMT;
      }
      // Bold key rows
      if (label === 'Taxable Income' || label === 'Total Tax') {
        ws.getCell(`A${row}`).font = { bold: true };
        ws.getCell(`B${row}`).font = { bold: true };
      }
      row++;
    }
    row++; // gap between sections
  }

  ws.getColumn(1).width = 32;
  ws.getColumn(2).width = 18;
}
