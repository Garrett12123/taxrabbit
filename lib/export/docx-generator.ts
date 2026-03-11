import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Packer,
  ShadingType,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
import type { SummaryData } from '@/lib/html/summary-template';
import type { TaxEstimate } from '@/server/services/tax-estimator-service';
import type { PersonProfileDecrypted } from '@/server/db/dal/person-profiles';
import type { BusinessProfileDecrypted } from '@/server/db/dal/business-profiles';

// ─── Colors ─────────────────────────────────────────────────────

const BRAND = '1B5E20';
const GRAY = '666666';
const LIGHT_BG = 'F5F5F5';

function fmtDollars(cents: number): string {
  const val = cents / 100;
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// ─── Types ──────────────────────────────────────────────────────

export type DocxData = {
  year: number;
  summary: SummaryData;
  taxEstimate: TaxEstimate;
  personProfiles: PersonProfileDecrypted[];
  businessProfile: BusinessProfileDecrypted | null;
  includeDocuments: boolean;
  documentCount: number;
};

// ─── DOCX generator ─────────────────────────────────────────────

export async function generateDocx(data: DocxData): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // ─── Header / Title ─────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'TaxRabbit', bold: true, size: 36, color: BRAND })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Tax Year ${data.year} — CPA Packet Cover Letter`, size: 24, color: '333333' })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Generated ${data.summary.generatedAt}`, size: 18, color: GRAY })],
      spacing: { after: 400 },
    }),
  );

  // ─── Taxpayer Information ────────────────────────────────────
  children.push(heading('Taxpayer Information'));

  for (const p of data.personProfiles) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${p.payload.firstName} ${p.payload.lastName}`, bold: true, size: 22 })],
        spacing: { after: 40 },
      }),
    );
    if (p.payload.ssn) {
      const masked = p.payload.ssn.length >= 4 ? `***-**-${p.payload.ssn.slice(-4)}` : '***-**-****';
      children.push(infoLine('SSN', masked));
    }
    if (p.payload.dateOfBirth) children.push(infoLine('Date of Birth', p.payload.dateOfBirth));
    const addr = [p.payload.address, p.payload.address2].filter(Boolean).join(', ');
    if (addr) children.push(infoLine('Address', addr));
    const csz = [p.payload.city, p.payload.state, p.payload.zip].filter(Boolean).join(', ');
    if (csz) children.push(infoLine('', csz));
    if (p.payload.phone) children.push(infoLine('Phone', p.payload.phone));
    if (p.payload.email) children.push(infoLine('Email', p.payload.email));
    children.push(spacer());
  }

  // ─── Business Information ────────────────────────────────────
  if (data.businessProfile) {
    children.push(heading('Business Information'));
    const bp = data.businessProfile.payload;
    children.push(infoLine('Business Name', bp.businessName));
    if (bp.ein) children.push(infoLine('EIN', bp.ein));
    if (bp.entityType) children.push(infoLine('Entity Type', bp.entityType));
    if (bp.accountingMethod) children.push(infoLine('Accounting Method', bp.accountingMethod));
    if (bp.stateOfFormation) children.push(infoLine('State of Formation', bp.stateOfFormation));
    if (bp.startDate) children.push(infoLine('Start Date', bp.startDate));
    const addr = [bp.address, bp.address2].filter(Boolean).join(', ');
    if (addr) children.push(infoLine('Address', addr));
    const csz = [bp.city, bp.state, bp.zip].filter(Boolean).join(', ');
    if (csz) children.push(infoLine('', csz));
    if (bp.homeOfficePercent != null) children.push(infoLine('Home Office %', `${bp.homeOfficePercent}%`));
    children.push(spacer());
  }

  // ─── Financial Summary ──────────────────────────────────────
  children.push(heading('Financial Summary'));

  const summaryRows: [string, string][] = [
    ['Total Income', fmtDollars(data.summary.income.total)],
    ['Federal Withholding', fmtDollars(data.summary.income.totalWithholding)],
    ['Total Expenses', fmtDollars(data.summary.expenses.totalAll)],
    ['Business Expenses', fmtDollars(data.summary.expenses.totalBusiness)],
  ];

  if (data.summary.mileage && data.summary.mileage.totalTrips > 0) {
    summaryRows.push(
      ['Total Miles', (data.summary.mileage.totalMiles / 100).toFixed(1)],
      ['Mileage Deduction', fmtDollars(data.summary.mileage.totalDeduction)],
    );
  }

  if (data.summary.utilityBills && data.summary.utilityBills.byType.length > 0) {
    summaryRows.push(
      ['Total Utility Costs', fmtDollars(data.summary.utilityBills.totalCost)],
      ['Utility Deduction', fmtDollars(data.summary.utilityBills.businessDeduction)],
    );
  }

  children.push(keyValueTable(summaryRows));
  children.push(spacer());

  // ─── Tax Estimate ───────────────────────────────────────────
  children.push(heading('Tax Estimate'));

  const est = data.taxEstimate;
  const isRefund = est.estimatedOwed < 0;

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: isRefund ? 'Estimated Refund: ' : 'Estimated Tax Owed: ',
          bold: true,
          size: 22,
        }),
        new TextRun({
          text: fmtDollars(Math.abs(est.estimatedOwed)),
          bold: true,
          size: 22,
          color: isRefund ? '16A34A' : 'DC2626',
        }),
      ],
      spacing: { after: 200 },
    }),
  );

  const taxRows: [string, string][] = [
    ['Gross Income', fmtDollars(est.grossIncome)],
    ['Self-Employment Income', fmtDollars(est.selfEmploymentIncome)],
    ['Business Expenses', fmtDollars(est.businessExpenses)],
    ['Mileage Deduction', fmtDollars(est.mileageDeduction)],
    ['Standard Deduction', fmtDollars(est.standardDeduction)],
    ['Taxable Income', fmtDollars(est.taxableIncome)],
    ['Federal Income Tax', fmtDollars(est.federalIncomeTax)],
    ['Self-Employment Tax', fmtDollars(est.selfEmploymentTax)],
    ['Total Tax', fmtDollars(est.totalTax)],
    ['Total Withholding', fmtDollars(est.totalWithholding)],
    ['Effective Rate', `${est.effectiveRate}%`],
    ['Marginal Rate', `${est.marginalRate}%`],
  ];

  children.push(keyValueTable(taxRows));
  children.push(spacer());

  // ─── Packet Contents ────────────────────────────────────────
  children.push(heading('Packet Contents'));

  const contents: string[] = [
    'Tax Summary Report.pdf — Complete financial summary with charts and tables',
    'Financial Data.xlsx — Styled spreadsheet with all financial data (Income, Expenses, Mileage, Utilities, Payments)',
    'Cover Letter.docx — This document',
    'data/ — Raw CSV files for import into tax software',
  ];
  if (data.includeDocuments) {
    contents.push(`documents/ — ${data.documentCount} decrypted document(s) organized by type`);
  }

  for (const item of contents) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `•  ${item}`, size: 20 })],
        spacing: { after: 60 },
        indent: { left: 200 },
      }),
    );
  }
  children.push(spacer());

  // ─── Security Notice ────────────────────────────────────────
  children.push(heading('Security Notice'));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'This packet may contain sensitive personal and financial information. ',
          size: 20,
        }),
        new TextRun({
          text: data.includeDocuments
            ? 'Attached documents have been decrypted from the TaxRabbit vault. '
            : '',
          size: 20,
        }),
        new TextRun({
          text: 'Store this file securely and delete it after sharing with your CPA.',
          size: 20,
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
  );

  // ─── Disclaimer ─────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Disclaimer: This summary is generated for organizational purposes only and does not constitute tax advice. '
            + 'Consult a qualified tax professional for tax preparation and filing guidance.',
          size: 16,
          color: GRAY,
          italics: true,
        }),
      ],
      spacing: { before: 400 },
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            pageNumbers: { start: 1 },
          },
        },
        headers: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'TaxRabbit CPA Packet — ', size: 14, color: GRAY }),
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                    size: 14,
                    color: GRAY,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
    numbering: {
      config: [{
        reference: 'bullet',
        levels: [{ level: 0, format: NumberFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT }],
      }],
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ─── Helpers ────────────────────────────────────────────────────

function heading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND } },
  });
}

function infoLine(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      ...(label ? [new TextRun({ text: `${label}: `, bold: true, size: 20 })] : []),
      new TextRun({ text: value, size: 20 }),
    ],
    spacing: { after: 30 },
    indent: { left: 200 },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 200 } });
}

function keyValueTable(rows: [string, string][]): Table {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value], i) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, size: 20 })] })],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders,
            shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: LIGHT_BG } : undefined,
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: value, size: 20, bold: true })],
              alignment: AlignmentType.RIGHT,
            })],
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders,
            shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: LIGHT_BG } : undefined,
          }),
        ],
      })
    ),
  });
}
