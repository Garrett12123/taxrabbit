import PDFDocument from 'pdfkit';
import type { SummaryData } from '@/lib/html/summary-template';
import type { TaxEstimate } from '@/server/services/tax-estimator-service';
import type { PersonProfileDecrypted } from '@/server/db/dal/person-profiles';
import type { BusinessProfileDecrypted } from '@/server/db/dal/business-profiles';

// ─── Colors & layout constants ──────────────────────────────────

const BRAND = '#1B5E20';
const GRAY = '#666666';
const LIGHT_GRAY = '#F5F5F5';
const BORDER = '#D0D0D0';
const RED = '#DC2626';
const GREEN = '#16A34A';

const PAGE_MARGIN = 50;
const COL_GAP = 10;

function fmtDollars(cents: number): string {
  const val = cents / 100;
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// ─── Types ──────────────────────────────────────────────────────

export type PdfData = {
  year: number;
  summary: SummaryData;
  taxEstimate: TaxEstimate;
  personProfiles: PersonProfileDecrypted[];
  businessProfile: BusinessProfileDecrypted | null;
};

// ─── PDF generator ──────────────────────────────────────────────

export function generatePdf(data: PdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      info: {
        Title: `TaxRabbit — Tax Year ${data.year} Summary`,
        Author: 'TaxRabbit',
        Creator: 'TaxRabbit',
      },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - PAGE_MARGIN * 2;

    // ─── Cover page ───────────────────────────────────────────
    doc.fontSize(28).fillColor(BRAND).text('TaxRabbit', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#333333').text(`Tax Year ${data.year}`, { align: 'center' });
    doc.fontSize(12).fillColor(GRAY).text('CPA Summary Report', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).fillColor(GRAY).text(`Generated ${data.summary.generatedAt}`, { align: 'center' });

    // Taxpayer info on cover
    doc.moveDown(3);
    for (const p of data.personProfiles) {
      doc.fontSize(12).fillColor('#333333').text(`${p.payload.firstName} ${p.payload.lastName}`, { align: 'center' });
      if (p.payload.ssn) {
        const masked = p.payload.ssn.length >= 4 ? `***-**-${p.payload.ssn.slice(-4)}` : '***-**-****';
        doc.fontSize(10).fillColor(GRAY).text(`SSN: ${masked}`, { align: 'center' });
      }
      const addrParts = [p.payload.address, p.payload.address2].filter(Boolean);
      if (addrParts.length) {
        doc.text(addrParts.join(', '), { align: 'center' });
      }
      const csz = [p.payload.city, p.payload.state, p.payload.zip].filter(Boolean).join(', ');
      if (csz) doc.text(csz, { align: 'center' });
      doc.moveDown(0.5);
    }

    if (data.businessProfile) {
      const bp = data.businessProfile.payload;
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#333333').text(bp.businessName, { align: 'center' });
      if (bp.ein) doc.fontSize(10).fillColor(GRAY).text(`EIN: ${bp.ein}`, { align: 'center' });
      if (bp.entityType) doc.text(`Entity: ${bp.entityType}`, { align: 'center' });
    }

    // ─── Summary overview page ────────────────────────────────
    doc.addPage();
    sectionTitle(doc, 'Financial Overview');

    // KPI boxes
    const kpis: [string, string][] = [
      ['Total Income', fmtDollars(data.summary.income.total)],
      ['Fed Withholding', fmtDollars(data.summary.income.totalWithholding)],
      ['Total Expenses', fmtDollars(data.summary.expenses.totalAll)],
      ['Business Expenses', fmtDollars(data.summary.expenses.totalBusiness)],
    ];

    drawKpiGrid(doc, kpis, pageWidth);
    doc.moveDown(1.5);

    // Income table
    if (data.summary.income.byType.length > 0) {
      sectionTitle(doc, 'Income by Form Type');
      const incRows = data.summary.income.byType.map((r) => [r.formType, String(r.count), fmtDollars(r.totalAmount)]);
      incRows.push(['Total', String(data.summary.income.byType.reduce((s, r) => s + r.count, 0)), fmtDollars(data.summary.income.total)]);
      drawTable(doc, ['Form Type', 'Count', 'Amount'], incRows, pageWidth, true);
      doc.moveDown(1.5);
    }

    // Business expenses
    const bizExp = data.summary.expenses.byCategory.filter((c) => c.entityType === 'business');
    if (bizExp.length > 0) {
      checkPageSpace(doc, 100);
      sectionTitle(doc, 'Business Expenses by Category');
      const rows = bizExp.map((r) => [r.category, String(r.count), fmtDollars(r.total)]);
      rows.push(['Total', '', fmtDollars(data.summary.expenses.totalBusiness)]);
      drawTable(doc, ['Category', 'Count', 'Amount'], rows, pageWidth, true);
      doc.moveDown(1.5);
    }

    // Personal expenses
    const perExp = data.summary.expenses.byCategory.filter((c) => !c.entityType || c.entityType === 'personal');
    if (perExp.length > 0) {
      checkPageSpace(doc, 100);
      sectionTitle(doc, 'Personal Expenses by Category');
      const rows = perExp.map((r) => [r.category, String(r.count), fmtDollars(r.total)]);
      rows.push(['Total', '', fmtDollars(data.summary.expenses.totalPersonal)]);
      drawTable(doc, ['Category', 'Count', 'Amount'], rows, pageWidth, true);
      doc.moveDown(1.5);
    }

    // Mileage
    if (data.summary.mileage && data.summary.mileage.totalTrips > 0) {
      checkPageSpace(doc, 80);
      sectionTitle(doc, 'Mileage');
      const m = data.summary.mileage;
      const mKpis: [string, string][] = [
        ['Total Miles', (m.totalMiles / 100).toFixed(1)],
        ['Total Trips', String(m.totalTrips)],
        ['IRS Rate', `$${(m.ratePerMileTenths / 1000).toFixed(m.ratePerMileTenths % 10 !== 0 ? 3 : 2)}/mi`],
        ['Deduction', fmtDollars(m.totalDeduction)],
      ];
      drawKpiGrid(doc, mKpis, pageWidth);
      doc.moveDown(1.5);
    }

    // Utilities
    if (data.summary.utilityBills && data.summary.utilityBills.byType.length > 0) {
      checkPageSpace(doc, 120);
      sectionTitle(doc, 'Utility Bills');
      const u = data.summary.utilityBills;
      const uKpis: [string, string][] = [
        ['Total Cost', fmtDollars(u.totalCost)],
        ['Home Office %', `${u.homeOfficePercent}%`],
        ['Business Deduction', fmtDollars(u.businessDeduction)],
        ['Bill Count', String(u.byType.reduce((s, r) => s + r.count, 0))],
      ];
      drawKpiGrid(doc, uKpis, pageWidth);
      doc.moveDown(1);

      const rows = u.byType.map((r) => [r.utilityType, String(r.count), fmtDollars(r.total)]);
      rows.push(['Total', String(u.byType.reduce((s, r) => s + r.count, 0)), fmtDollars(u.totalCost)]);
      drawTable(doc, ['Utility Type', 'Count', 'Amount'], rows, pageWidth, true);
      doc.moveDown(1.5);
    }

    // Estimated payments
    if (data.summary.estimatedPayments && data.summary.estimatedPayments.length > 0) {
      checkPageSpace(doc, 100);
      sectionTitle(doc, 'Estimated Tax Payments');
      const rows = data.summary.estimatedPayments.map((p) => [
        p.label,
        p.dueDate,
        fmtDollars(p.amountPaid),
        p.isPaid ? 'Paid' : 'Unpaid',
      ]);
      const totalPaid = data.summary.estimatedPayments.reduce((s, p) => s + p.amountPaid, 0);
      rows.push(['Total', '', fmtDollars(totalPaid), '']);
      drawTable(doc, ['Quarter', 'Due Date', 'Amount Paid', 'Status'], rows, pageWidth, true);
      doc.moveDown(1.5);
    }

    // ─── Tax estimate page ────────────────────────────────────
    doc.addPage();
    sectionTitle(doc, 'Federal Tax Estimate');

    const est = data.taxEstimate;
    const isRefund = est.estimatedOwed < 0;

    // Bottom line highlight
    const hlY = doc.y;
    doc.rect(PAGE_MARGIN, hlY, pageWidth, 40).fill('#F5F5F5');
    doc.fontSize(11).fillColor(GRAY).text(
      isRefund ? 'Estimated Refund' : 'Estimated Tax Owed',
      PAGE_MARGIN + 12, hlY + 6
    );
    doc.fontSize(16).fillColor(isRefund ? GREEN : RED).text(
      fmtDollars(Math.abs(est.estimatedOwed)),
      PAGE_MARGIN + 12, hlY + 20
    );
    doc.y = hlY + 50;

    // Tax breakdown tables
    const taxSections: [string, [string, string, boolean?][]][] = [
      ['Income', [
        ['Gross Income', fmtDollars(est.grossIncome)],
        ['Self-Employment Income', fmtDollars(est.selfEmploymentIncome)],
      ]],
      ['Deductions', [
        ['Business Expenses', fmtDollars(est.businessExpenses)],
        ['Mileage Deduction', fmtDollars(est.mileageDeduction)],
        ['Utility Deduction (Home Office)', fmtDollars(est.utilityDeduction)],
        ['Standard Deduction', fmtDollars(est.standardDeduction)],
        ['Taxable Income', fmtDollars(est.taxableIncome), true],
      ]],
      ['Taxes', [
        ['Federal Income Tax', fmtDollars(est.federalIncomeTax)],
        ['Self-Employment Tax', fmtDollars(est.selfEmploymentTax)],
        ...(est.additionalMedicareTax > 0
          ? [['Additional Medicare Tax (0.9%)', fmtDollars(est.additionalMedicareTax)] as [string, string]]
          : []),
        ['Total Tax', fmtDollars(est.totalTax), true],
      ]],
      ['Withholding & Payments', [
        ['Total Withholding', fmtDollars(est.totalWithholding)],
        ['State Withholding', fmtDollars(est.stateWithholding)],
      ]],
    ];

    for (const [title, items] of taxSections) {
      checkPageSpace(doc, 60 + items.length * 20);
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(BRAND).text(title, { underline: true });
      doc.moveDown(0.3);

      for (const [label, value, bold] of items) {
        const y = doc.y;
        doc.fontSize(10).fillColor(bold ? '#000000' : '#333333');
        if (bold) doc.font('Helvetica-Bold');
        doc.text(label, PAGE_MARGIN, y);
        doc.text(value, PAGE_MARGIN, y, { width: pageWidth, align: 'right' });
        if (bold) doc.font('Helvetica');
        doc.moveDown(0.3);
      }
    }

    // Rates
    doc.moveDown(1);
    doc.fontSize(10).fillColor(GRAY);
    doc.text(`Effective Rate: ${est.effectiveRate}%    |    Marginal Rate: ${est.marginalRate}%`);

    // Disclaimer
    doc.moveDown(2);
    doc.fontSize(8).fillColor(GRAY).text(
      'Disclaimer: This tax estimate is generated for informational purposes only and does not constitute tax advice. ' +
      'Actual tax liability may differ. Consult a qualified tax professional for tax preparation and filing guidance.',
      { width: pageWidth }
    );

    // ─── Page numbers ─────────────────────────────────────────
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(GRAY).text(
        `Page ${i + 1} of ${pageCount}`,
        PAGE_MARGIN,
        doc.page.height - 35,
        { width: pageWidth, align: 'center' }
      );
    }

    doc.end();
  });
}

// ─── Drawing helpers ────────────────────────────────────────────

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(14).fillColor(BRAND).text(title);
  doc.moveTo(PAGE_MARGIN, doc.y + 2)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2)
    .strokeColor(BRAND)
    .lineWidth(1.5)
    .stroke();
  doc.moveDown(0.6);
}

function checkPageSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN - 40) {
    doc.addPage();
  }
}

function drawKpiGrid(doc: PDFKit.PDFDocument, kpis: [string, string][], pageWidth: number) {
  const cols = Math.min(kpis.length, 4);
  const boxW = (pageWidth - COL_GAP * (cols - 1)) / cols;
  const startY = doc.y;

  for (let i = 0; i < kpis.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAGE_MARGIN + col * (boxW + COL_GAP);
    const y = startY + row * 48;

    // Box background
    doc.rect(x, y, boxW, 42).fill(LIGHT_GRAY);

    // Label
    doc.fontSize(8).fillColor(GRAY).text(
      kpis[i][0].toUpperCase(),
      x + 8, y + 6,
      { width: boxW - 16 }
    );

    // Value
    doc.fontSize(13).fillColor('#1a1a1a').text(
      kpis[i][1],
      x + 8, y + 20,
      { width: boxW - 16 }
    );
  }

  const totalRows = Math.ceil(kpis.length / cols);
  doc.y = startY + totalRows * 48 + 4;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  pageWidth: number,
  lastRowIsTotal: boolean,
) {
  const colWidths = headers.map(() => pageWidth / headers.length);
  const rowHeight = 20;

  let y = doc.y;

  // Header
  doc.rect(PAGE_MARGIN, y, pageWidth, rowHeight).fill(BRAND);
  for (let i = 0; i < headers.length; i++) {
    const x = PAGE_MARGIN + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
    const align = i >= headers.length - 1 ? 'right' as const : 'left' as const;
    doc.fontSize(9).fillColor('#FFFFFF').text(
      headers[i],
      x + 6, y + 5,
      { width: colWidths[i] - 12, align }
    );
  }
  y += rowHeight;

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    checkPageSpace(doc, rowHeight + 10);
    if (doc.y !== y) y = doc.y; // page break happened

    const isTotal = lastRowIsTotal && r === rows.length - 1;
    const isStripe = !isTotal && r % 2 === 1;

    if (isTotal) {
      doc.rect(PAGE_MARGIN, y, pageWidth, rowHeight).fill('#E8F5E9');
    } else if (isStripe) {
      doc.rect(PAGE_MARGIN, y, pageWidth, rowHeight).fill(LIGHT_GRAY);
    }

    // Bottom border
    doc.moveTo(PAGE_MARGIN, y + rowHeight)
      .lineTo(PAGE_MARGIN + pageWidth, y + rowHeight)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    for (let i = 0; i < headers.length; i++) {
      const x = PAGE_MARGIN + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
      const val = rows[r][i] ?? '';
      const align = i >= headers.length - 1 ? 'right' as const : 'left' as const;
      doc.fontSize(9).fillColor(isTotal ? '#000000' : '#333333');
      if (isTotal) doc.font('Helvetica-Bold');
      doc.text(val, x + 6, y + 5, { width: colWidths[i] - 12, align });
      if (isTotal) doc.font('Helvetica');
    }
    y += rowHeight;
  }

  doc.y = y + 4;
}
