import { centsToDollars } from '@/lib/utils';
import type { TaxEstimate, FilingStatus } from '@/server/services/tax-estimator-service';

function fmtDollars(cents: number): string {
  const val = Number(centsToDollars(cents));
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  mfj: 'Married Filing Jointly',
  mfs: 'Married Filing Separately',
  hoh: 'Head of Household',
};

export function generateTaxEstimateHTML(year: number, estimate: TaxEstimate): string {
  const isRefund = estimate.estimatedOwed < 0;
  const bottomLineLabel = isRefund ? 'Estimated Refund' : 'Estimated Tax Owed';
  const bottomLineValue = isRefund ? fmtDollars(-estimate.estimatedOwed) : fmtDollars(estimate.estimatedOwed);
  const bottomLineColor = isRefund ? '#16a34a' : '#dc2626';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tax Year ${year} Estimate</title>
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
  .bottom-line { text-align: center; margin: 2rem 0; padding: 1.5rem; border: 2px solid #e5e5e5; border-radius: 8px; }
  .bottom-line .label { font-size: 0.875rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .bottom-line .value { font-size: 2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
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
  <h1>Tax Year ${year} Estimate</h1>
  <p class="subtitle">Filing Status: ${FILING_STATUS_LABELS[estimate.filingStatus]}</p>

  <div class="bottom-line">
    <div class="label">${bottomLineLabel}</div>
    <div class="value" style="color: ${bottomLineColor}">${bottomLineValue}</div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Effective Tax Rate</div>
      <div class="value">${estimate.effectiveRate}%</div>
    </div>
    <div class="summary-box">
      <div class="label">Marginal Tax Rate</div>
      <div class="value">${estimate.marginalRate}%</div>
    </div>
  </div>

  <h2>Income</h2>
  <table>
    <tbody>
      <tr><td>Gross Income</td><td class="num">${fmtDollars(estimate.grossIncome)}</td></tr>
      <tr><td>Self-Employment Income</td><td class="num">${fmtDollars(estimate.selfEmploymentIncome)}</td></tr>
    </tbody>
  </table>

  <h2>Deductions</h2>
  <table>
    <tbody>
      <tr><td>Business Expenses</td><td class="num">${fmtDollars(estimate.businessExpenses)}</td></tr>
      <tr><td>Mileage Deduction</td><td class="num">${fmtDollars(estimate.mileageDeduction)}</td></tr>
      <tr><td>Utility Deduction (Home Office)</td><td class="num">${fmtDollars(estimate.utilityDeduction)}</td></tr>
      <tr><td>Standard Deduction</td><td class="num">${fmtDollars(estimate.standardDeduction)}</td></tr>
      <tr class="total-row"><td>Taxable Income</td><td class="num">${fmtDollars(estimate.taxableIncome)}</td></tr>
    </tbody>
  </table>

  <h2>Taxes</h2>
  <table>
    <tbody>
      <tr><td>Federal Income Tax</td><td class="num">${fmtDollars(estimate.federalIncomeTax)}</td></tr>
      <tr><td>Self-Employment Tax</td><td class="num">${fmtDollars(estimate.selfEmploymentTax)}</td></tr>
      ${estimate.additionalMedicareTax > 0 ? `<tr><td>Additional Medicare Tax (0.9%)</td><td class="num">${fmtDollars(estimate.additionalMedicareTax)}</td></tr>` : ''}
      <tr class="total-row"><td>Total Tax</td><td class="num">${fmtDollars(estimate.totalTax)}</td></tr>
    </tbody>
  </table>

  <h2>Withholding &amp; Payments</h2>
  <table>
    <tbody>
      <tr><td>Total Withholding (Federal + State)</td><td class="num">${fmtDollars(estimate.totalWithholding)}</td></tr>
      <tr><td>State Withholding</td><td class="num">${fmtDollars(estimate.stateWithholding)}</td></tr>
    </tbody>
  </table>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This tax estimate is generated for informational purposes only and does not constitute tax advice. Actual tax liability may differ. Consult a qualified tax professional for tax preparation and filing guidance.
  </div>
</body>
</html>`;
}
