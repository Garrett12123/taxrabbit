import { describe, it, expect } from 'vitest';

import { generateTaxEstimateHTML } from '@/lib/html/tax-estimate-template';
import type { TaxEstimate } from '@/server/services/tax-estimator-service';

function makeEstimate(overrides: Partial<TaxEstimate> = {}): TaxEstimate {
  return {
    grossIncome: 10000000, // $100,000
    selfEmploymentIncome: 5000000,
    businessExpenses: 1000000,
    mileageDeduction: 500000,
    utilityDeduction: 200000,
    standardDeduction: 1500000,
    taxableIncome: 6800000,
    selfEmploymentTax: 706200,
    additionalMedicareTax: 0,
    federalIncomeTax: 910000,
    stateWithholding: 200000,
    totalTax: 1616200,
    totalWithholding: 1500000,
    estimatedOwed: 116200,
    effectiveRate: 16.2,
    marginalRate: 22,
    filingStatus: 'single',
    ...overrides,
  };
}

describe('generateTaxEstimateHTML', () => {
  it('returns valid HTML with correct title', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Tax Year 2025 Estimate</title>');
  });

  it('shows filing status label', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate({ filingStatus: 'mfj' }));
    expect(html).toContain('Married Filing Jointly');
  });

  it('shows all filing status labels', () => {
    expect(generateTaxEstimateHTML(2025, makeEstimate({ filingStatus: 'single' }))).toContain('Single');
    expect(generateTaxEstimateHTML(2025, makeEstimate({ filingStatus: 'mfs' }))).toContain('Married Filing Separately');
    expect(generateTaxEstimateHTML(2025, makeEstimate({ filingStatus: 'hoh' }))).toContain('Head of Household');
  });

  it('shows "Estimated Tax Owed" when positive', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate({ estimatedOwed: 50000 }));
    expect(html).toContain('Estimated Tax Owed');
    expect(html).not.toContain('Estimated Refund');
  });

  it('shows "Estimated Refund" when negative', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate({ estimatedOwed: -50000 }));
    expect(html).toContain('Estimated Refund');
    expect(html).not.toContain('Estimated Tax Owed');
  });

  it('contains income section', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate());
    expect(html).toContain('Gross Income');
    expect(html).toContain('Self-Employment Income');
  });

  it('contains deductions section', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate());
    expect(html).toContain('Business Expenses');
    expect(html).toContain('Mileage Deduction');
    expect(html).toContain('Utility Deduction (Home Office)');
    expect(html).toContain('Standard Deduction');
    expect(html).toContain('Taxable Income');
  });

  it('contains taxes section', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate());
    expect(html).toContain('Federal Income Tax');
    expect(html).toContain('Self-Employment Tax');
    expect(html).toContain('Total Tax');
  });

  it('shows additional Medicare tax when present', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate({ additionalMedicareTax: 45000 }));
    expect(html).toContain('Additional Medicare Tax (0.9%)');
  });

  it('hides additional Medicare tax when zero', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate({ additionalMedicareTax: 0 }));
    expect(html).not.toContain('Additional Medicare Tax');
  });

  it('contains withholding section', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate());
    expect(html).toContain('Total Withholding (Federal + State)');
    expect(html).toContain('State Withholding');
  });

  it('contains effective and marginal rate', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate({ effectiveRate: 16.2, marginalRate: 22 }));
    expect(html).toContain('16.2%');
    expect(html).toContain('22%');
  });

  it('contains disclaimer', () => {
    const html = generateTaxEstimateHTML(2025, makeEstimate());
    expect(html).toContain('Disclaimer');
    expect(html).toContain('does not constitute tax advice');
  });
});
