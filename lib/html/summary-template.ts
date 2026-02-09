import { centsToDollars } from '@/lib/utils';

export type SummaryIncomeByType = {
  formType: string;
  totalAmount: number;
  count: number;
};

export type SummaryExpenseByCategory = {
  category: string;
  total: number;
  count: number;
  entityType?: 'personal' | 'business';
};

export type SummaryMileage = {
  totalMiles: number; // miles * 100
  totalTrips: number;
  totalDeduction: number; // cents
  ratePerMile: number; // cents
};

export type SummaryEstimatedPayment = {
  quarter: number;
  label: string;
  dueDate: string;
  amountPaid: number; // cents
  isPaid: boolean;
};

export type SummaryData = {
  year: number;
  generatedAt: string;
  income: {
    total: number;
    totalWithholding: number;
    byType: SummaryIncomeByType[];
  };
  expenses: {
    totalAll: number;
    totalPersonal: number;
    totalBusiness: number;
    byCategory: SummaryExpenseByCategory[];
  };
  mileage?: SummaryMileage;
  estimatedPayments?: SummaryEstimatedPayment[];
  documents: {
    totalCount: number;
    totalSize: number;
    linkedCount: number;
    unlinkedCount: number;
  };
  checklist: {
    total: number;
    completed: number;
  };
};

function fmtDollars(cents: number): string {
  const val = Number(centsToDollars(cents));
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateSummaryHTML(data: SummaryData): string {
  const incomeRows = data.income.byType
    .map(
      (r) => `
        <tr>
          <td>${escapeHtml(r.formType)}</td>
          <td class="num">${r.count}</td>
          <td class="num">${fmtDollars(r.totalAmount)}</td>
        </tr>`
    )
    .join('');

  const personalExpenses = data.expenses.byCategory.filter(
    (c) => !c.entityType || c.entityType === 'personal'
  );
  const businessExpenses = data.expenses.byCategory.filter(
    (c) => c.entityType === 'business'
  );

  function expenseRows(items: SummaryExpenseByCategory[]): string {
    return items
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.category)}</td>
          <td class="num">${r.count}</td>
          <td class="num">${fmtDollars(r.total)}</td>
        </tr>`
      )
      .join('');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tax Year ${data.year} Summary</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.25rem; }
  .subtitle { color: #666; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  th, td { padding: 0.4rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e5e5; font-size: 0.875rem; }
  th { font-weight: 600; background: #f9f9f9; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row { font-weight: 600; border-top: 2px solid #333; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .summary-box { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 6px; padding: 0.75rem 1rem; }
  .summary-box .label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .summary-box .value { font-size: 1.25rem; font-weight: 600; font-variant-numeric: tabular-nums; }
  .disclaimer { margin-top: 2rem; padding: 1rem; background: #fef9c3; border: 1px solid #fde68a; border-radius: 6px; font-size: 0.8rem; color: #854d0e; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
    h2 { break-after: avoid; }
    table { break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>Tax Year ${data.year} Summary</h1>
  <p class="subtitle">Generated ${escapeHtml(data.generatedAt)}</p>

  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Total Income</div>
      <div class="value">${fmtDollars(data.income.total)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Fed Withholding</div>
      <div class="value">${fmtDollars(data.income.totalWithholding)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Expenses</div>
      <div class="value">${fmtDollars(data.expenses.totalAll)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Business Expenses</div>
      <div class="value">${fmtDollars(data.expenses.totalBusiness)}</div>
    </div>
  </div>

  <h2>Income by Form Type</h2>
  ${
    data.income.byType.length > 0
      ? `<table>
    <thead><tr><th>Form Type</th><th class="num">Count</th><th class="num">Amount</th></tr></thead>
    <tbody>
      ${incomeRows}
      <tr class="total-row"><td>Total</td><td class="num">${data.income.byType.reduce((s, r) => s + r.count, 0)}</td><td class="num">${fmtDollars(data.income.total)}</td></tr>
    </tbody>
  </table>`
      : '<p>No income forms recorded.</p>'
  }

  ${
    businessExpenses.length > 0
      ? `<h2>Business Expenses by Category</h2>
  <table>
    <thead><tr><th>Category</th><th class="num">Count</th><th class="num">Amount</th></tr></thead>
    <tbody>
      ${expenseRows(businessExpenses)}
      <tr class="total-row"><td>Total</td><td></td><td class="num">${fmtDollars(data.expenses.totalBusiness)}</td></tr>
    </tbody>
  </table>`
      : ''
  }

  ${
    personalExpenses.length > 0
      ? `<h2>Personal Expenses by Category</h2>
  <table>
    <thead><tr><th>Category</th><th class="num">Count</th><th class="num">Amount</th></tr></thead>
    <tbody>
      ${expenseRows(personalExpenses)}
      <tr class="total-row"><td>Total</td><td></td><td class="num">${fmtDollars(data.expenses.totalPersonal)}</td></tr>
    </tbody>
  </table>`
      : ''
  }

  ${
    data.mileage && data.mileage.totalTrips > 0
      ? `<h2>Mileage</h2>
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Total Miles</div>
      <div class="value">${(data.mileage.totalMiles / 100).toFixed(1)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Trips</div>
      <div class="value">${data.mileage.totalTrips}</div>
    </div>
    <div class="summary-box">
      <div class="label">IRS Rate</div>
      <div class="value">$${(data.mileage.ratePerMile / 100).toFixed(2)}/mi</div>
    </div>
    <div class="summary-box">
      <div class="label">Mileage Deduction</div>
      <div class="value">${fmtDollars(data.mileage.totalDeduction)}</div>
    </div>
  </div>`
      : ''
  }

  ${
    data.estimatedPayments && data.estimatedPayments.length > 0
      ? `<h2>Estimated Tax Payments</h2>
  <table>
    <thead><tr><th>Quarter</th><th>Due Date</th><th class="num">Amount Paid</th><th>Status</th></tr></thead>
    <tbody>
      ${data.estimatedPayments
        .map(
          (p) => `
        <tr>
          <td>${escapeHtml(p.label)}</td>
          <td>${escapeHtml(p.dueDate)}</td>
          <td class="num">${fmtDollars(p.amountPaid)}</td>
          <td>${p.isPaid ? 'Paid' : 'Unpaid'}</td>
        </tr>`
        )
        .join('')}
      <tr class="total-row"><td>Total</td><td></td><td class="num">${fmtDollars(data.estimatedPayments.reduce((s, p) => s + p.amountPaid, 0))}</td><td></td></tr>
    </tbody>
  </table>`
      : ''
  }

  <h2>Documents</h2>
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Total Documents</div>
      <div class="value">${data.documents.totalCount}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Size</div>
      <div class="value">${fmtBytes(data.documents.totalSize)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Linked</div>
      <div class="value">${data.documents.linkedCount}</div>
    </div>
    <div class="summary-box">
      <div class="label">Unlinked</div>
      <div class="value">${data.documents.unlinkedCount}</div>
    </div>
  </div>

  ${
    data.checklist.total > 0
      ? `<h2>Checklist</h2>
  <p>${data.checklist.completed} of ${data.checklist.total} items completed.</p>`
      : ''
  }

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This summary is generated for organizational purposes only and does not constitute tax advice. Consult a qualified tax professional for tax preparation and filing guidance.
  </div>
</body>
</html>`;
}
