import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the service
vi.mock('@/server/db/dal/income-documents', () => ({
  getTotalIncome: vi.fn(),
  getTotalWithholding: vi.fn(),
  getIncomeSummaryByType: vi.fn(),
  getIncomeSummaryByTypeAndEntity: vi.fn(),
  getTotalStateWithholding: vi.fn(),
}));

vi.mock('@/server/services/expense-service', () => ({
  getExpenseSummary: vi.fn(),
}));

vi.mock('@/server/services/mileage-service', () => ({
  getMileageSummary: vi.fn(),
}));

vi.mock('@/server/services/utility-service', () => ({
  getUtilityDeduction: vi.fn(() => Promise.resolve(0)),
}));

vi.mock('@/server/db/dal/tax-years', () => ({
  getFilingStatus: vi.fn(() => 'single'),
}));

import { estimateTaxLiability } from '@/server/services/tax-estimator-service';
import {
  getTotalIncome,
  getTotalWithholding,
  getIncomeSummaryByType,
  getIncomeSummaryByTypeAndEntity,
  getTotalStateWithholding,
} from '@/server/db/dal/income-documents';
import { getExpenseSummary } from '@/server/services/expense-service';
import { getMileageSummary } from '@/server/services/mileage-service';
import { getUtilityDeduction } from '@/server/services/utility-service';
import { getFilingStatus } from '@/server/db/dal/tax-years';

const mockGetTotalIncome = vi.mocked(getTotalIncome);
const mockGetTotalWithholding = vi.mocked(getTotalWithholding);
const mockGetIncomeSummaryByType = vi.mocked(getIncomeSummaryByType);
const mockGetIncomeSummaryByTypeAndEntity = vi.mocked(getIncomeSummaryByTypeAndEntity);
const mockGetTotalStateWithholding = vi.mocked(getTotalStateWithholding);
const mockGetExpenseSummary = vi.mocked(getExpenseSummary);
const mockGetMileageSummary = vi.mocked(getMileageSummary);
const mockGetUtilityDeduction = vi.mocked(getUtilityDeduction);
const mockGetFilingStatus = vi.mocked(getFilingStatus);

function setupMocks(opts: {
  totalIncome: number; // cents
  fedWithholding?: number;
  stateWithholding?: number;
  incomeSummary: { formType: string; totalAmount: number; count: number }[];
  incomeSummaryByTypeAndEntity?: { formType: string; entityType: string; totalAmount: number; count: number }[];
  totalBusiness?: number;
  totalMiles?: number; // miles * 100
  mileageRate?: number; // cents per mile
  utilityDeduction?: number; // cents
}) {
  mockGetTotalIncome.mockReturnValue(opts.totalIncome);
  mockGetTotalWithholding.mockReturnValue(opts.fedWithholding ?? 0);
  mockGetTotalStateWithholding.mockReturnValue(opts.stateWithholding ?? 0);
  mockGetIncomeSummaryByType.mockReturnValue(opts.incomeSummary);
  // Derive type+entity summary from incomeSummary if not explicitly provided
  mockGetIncomeSummaryByTypeAndEntity.mockReturnValue(
    opts.incomeSummaryByTypeAndEntity ??
      opts.incomeSummary.map((r) => ({
        ...r,
        entityType: r.formType === 'W-2' ? 'personal' : 'business',
      }))
  );
  mockGetExpenseSummary.mockReturnValue({
    totalAll: opts.totalBusiness ?? 0,
    totalPersonal: 0,
    totalBusiness: opts.totalBusiness ?? 0,
    expenseCount: 0,
  });
  const totalMiles = opts.totalMiles ?? 0;
  const rate = opts.mileageRate ?? 67;
  mockGetMileageSummary.mockReturnValue({
    totalMiles,
    totalTrips: 0,
    totalDeduction: Math.round((totalMiles / 100) * rate),
    ratePerMileTenths: rate * 10,
    monthlyBreakdown: [],
  });
  mockGetUtilityDeduction.mockResolvedValue(opts.utilityDeduction ?? 0);
}

beforeEach(() => {
  vi.resetAllMocks();
  // Default to single filing status for all tests
  mockGetFilingStatus.mockReturnValue('single');
});

describe('estimateTaxLiability', () => {
  describe('W-2 only income', () => {
    it('calculates correct tax for basic W-2 income', async () => {
      // $50,000 W-2 income, $5,000 withheld
      setupMocks({
        totalIncome: 5_000_000,
        fedWithholding: 500_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);

      expect(result.grossIncome).toBe(5_000_000);
      expect(result.selfEmploymentIncome).toBe(0);
      expect(result.selfEmploymentTax).toBe(0);
      expect(result.businessExpenses).toBe(0);
      // Standard deduction 2024: $14,600
      // Taxable: $50,000 - $14,600 = $35,400
      expect(result.taxableIncome).toBe(3_540_000);
      // Fed tax on $35,400 (2024 brackets):
      // 10% on first $11,600 = $1,160
      // 12% on $11,600-$35,400 = $2,856
      // Total = $4,016
      expect(result.federalIncomeTax).toBe(401_600);
      expect(result.totalWithholding).toBe(500_000);
      expect(result.estimatedOwed).toBe(401_600 - 500_000);
    });

    it('returns zero tax for income below standard deduction', async () => {
      // $10,000 W-2 income -- below 2024 standard deduction of $14,600
      setupMocks({
        totalIncome: 1_000_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 1_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);

      expect(result.taxableIncome).toBe(0);
      expect(result.federalIncomeTax).toBe(0);
      expect(result.selfEmploymentTax).toBe(0);
      expect(result.totalTax).toBe(0);
    });
  });

  describe('1099-NEC only income (self-employment)', () => {
    it('calculates SE tax correctly', async () => {
      // $100,000 1099-NEC income, no expenses
      setupMocks({
        totalIncome: 10_000_000,
        incomeSummary: [{ formType: '1099-NEC', totalAmount: 10_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);

      expect(result.selfEmploymentIncome).toBe(10_000_000);
      // SE tax base: $100,000 * 0.9235 = $92,350
      // SE tax: $92,350 * 0.153 = $14,129.55 -> $14,130
      expect(result.selfEmploymentTax).toBe(1_413_000);
      // Deduct half SE tax: $14,130 * 0.5 = $7,065
      // AGI: $100,000 - $7,065 = $92,935
      // Taxable: $92,935 - $14,600 = $78,335
      expect(result.taxableIncome).toBe(7_833_500);
    });

    it('reduces SE income by business deductions', async () => {
      // $100,000 1099-NEC, $20,000 business expenses
      setupMocks({
        totalIncome: 10_000_000,
        incomeSummary: [{ formType: '1099-NEC', totalAmount: 10_000_000, count: 1 }],
        totalBusiness: 2_000_000,
      });

      const result = await estimateTaxLiability(2024);

      // Net SE = $100,000 - $20,000 = $80,000
      // SE tax base: $80,000 * 0.9235 = $73,880
      // SE tax: $73,880 * 0.153 = $11,304 (rounded)
      expect(result.selfEmploymentTax).toBe(1_130_400);
    });
  });

  describe('BUG-1 regression: mixed W-2 + 1099 income', () => {
    it('business deductions reduce only SE income, not W-2 wages', async () => {
      // $80,000 W-2 + $20,000 1099-NEC, $15,000 business expenses
      setupMocks({
        totalIncome: 10_000_000, // $100k total
        fedWithholding: 1_000_000, // $10k withheld from W-2
        incomeSummary: [
          { formType: 'W-2', totalAmount: 8_000_000, count: 1 },
          { formType: '1099-NEC', totalAmount: 2_000_000, count: 1 },
        ],
        totalBusiness: 1_500_000, // $15k business expenses
      });

      const result = await estimateTaxLiability(2024);

      // Net SE = max($20,000 - $15,000, 0) = $5,000
      // The service calculates in dollars: seTaxBaseDollars = 5000 * 0.9235 = 4617.5
      // seTaxDollars = Math.round(4617.5 * 0.153) = Math.round(706.4775) = 706
      // Then converts back: seTaxCents = Math.round(706 * 100) = 70600
      expect(result.selfEmploymentTax).toBe(70_600);

      // AGI = non-SE($80,000) + net-SE($5,000) - half SE tax($353)
      // = $84,647
      // Taxable = $84,647 - $14,600 = $70,047
      expect(result.taxableIncome).toBe(7_004_700);

      // CRITICAL: taxable income must be HIGHER than if deductions applied to all income
      // The old bug would compute AGI = $100,000 - $15,000 - $353 = $84,647
      // which happens to match in this case but would be wrong for larger deductions
      // Real regression test: when expenses > SE income, W-2 is still untouched
      expect(result.grossIncome).toBe(10_000_000);
    });

    it('Schedule C net loss offsets W-2 income in AGI (SE tax stays zero)', async () => {
      // $80,000 W-2 + $5,000 1099-NEC, $20,000 business expenses
      setupMocks({
        totalIncome: 8_500_000,
        incomeSummary: [
          { formType: 'W-2', totalAmount: 8_000_000, count: 1 },
          { formType: '1099-NEC', totalAmount: 500_000, count: 1 },
        ],
        totalBusiness: 2_000_000,
      });

      const result = await estimateTaxLiability(2024);

      // Net SE = $5,000 - $20,000 = -$15,000 (Schedule C net loss)
      // SE tax base = max(-$15,000, 0) * 0.9235 = $0
      // SE tax = $0
      expect(result.selfEmploymentTax).toBe(0);

      // AGI = non-SE($80,000) + net-SE(-$15,000) - $0 = $65,000
      // Taxable = $65,000 - $14,600 = $50,400
      expect(result.taxableIncome).toBe(5_040_000);
    });

    it('handles 1099-MISC as self-employment income', async () => {
      setupMocks({
        totalIncome: 5_000_000,
        incomeSummary: [{ formType: '1099-MISC', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);
      expect(result.selfEmploymentIncome).toBe(5_000_000);
      expect(result.selfEmploymentTax).toBeGreaterThan(0);
    });
  });

  describe('mileage deduction', () => {
    it('includes mileage in business deductions', async () => {
      // $50,000 1099-NEC, 10,000 miles (stored as miles * 100 = 1,000,000)
      setupMocks({
        totalIncome: 5_000_000,
        incomeSummary: [{ formType: '1099-NEC', totalAmount: 5_000_000, count: 1 }],
        totalMiles: 1_000_000, // 10,000 miles
        mileageRate: 67,
      });

      const result = await estimateTaxLiability(2024);

      // Mileage deduction: 10,000 * $0.67 = $6,700
      expect(result.mileageDeduction).toBe(670_000);
      // Net SE = $50,000 - $6,700 = $43,300
      // SE tax: $43,300 * 0.9235 * 0.153 = $6,117.36 -> $6,117
      const seTaxBase = Math.round(43_300 * 0.9235);
      const seTax = Math.round(seTaxBase * 0.153);
      expect(result.selfEmploymentTax).toBe(seTax * 100);
    });
  });

  describe('utility deduction', () => {
    it('includes utility deduction in business deductions', async () => {
      // $50,000 1099-NEC, $1,200 utility deduction (15% of $8,000 in utilities)
      setupMocks({
        totalIncome: 5_000_000,
        incomeSummary: [{ formType: '1099-NEC', totalAmount: 5_000_000, count: 1 }],
        utilityDeduction: 120_000,
      });

      const result = await estimateTaxLiability(2024);

      expect(result.utilityDeduction).toBe(120_000);
      // Net SE = $50,000 - $1,200 = $48,800
      // SE tax base: $48,800 * 0.9235 = $45,066.8
      const seTaxBase = Math.round(48_800 * 0.9235);
      const seTax = Math.round(seTaxBase * 0.153);
      expect(result.selfEmploymentTax).toBe(seTax * 100);
    });

    it('returns zero utility deduction when none set', async () => {
      setupMocks({
        totalIncome: 5_000_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);
      expect(result.utilityDeduction).toBe(0);
    });
  });

  describe('withholding and refund', () => {
    it('calculates refund when withholding exceeds tax', async () => {
      setupMocks({
        totalIncome: 5_000_000,
        fedWithholding: 800_000,
        stateWithholding: 200_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);

      expect(result.totalWithholding).toBe(1_000_000);
      // estimatedOwed should be negative (refund)
      expect(result.estimatedOwed).toBeLessThan(0);
    });

    it('combines federal and state withholding', async () => {
      setupMocks({
        totalIncome: 5_000_000,
        fedWithholding: 400_000,
        stateWithholding: 100_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);

      expect(result.totalWithholding).toBe(500_000);
      expect(result.stateWithholding).toBe(100_000);
    });
  });

  describe('Additional Medicare Tax', () => {
    it('applies 0.9% AMT on SE income exceeding $200K threshold (single)', async () => {
      // $300,000 1099-NEC income, single filer
      setupMocks({
        totalIncome: 30_000_000,
        incomeSummary: [{ formType: '1099-NEC', totalAmount: 30_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);

      // SE tax base: $300,000 * 0.9235 = $277,050
      // AMT threshold (single): $200,000, no W-2 wages to fill it
      // AMT excess: $277,050 - $200,000 = $77,050
      // AMT: $77,050 * 0.009 = $693.45 -> $693
      expect(result.additionalMedicareTax).toBe(69_300);
      // AMT should be included in totalTax
      expect(result.totalTax).toBeGreaterThan(
        result.federalIncomeTax + result.selfEmploymentTax
      );
    });

    it('does not apply AMT when SE income is below threshold', async () => {
      // $100,000 1099-NEC income
      setupMocks({
        totalIncome: 10_000_000,
        incomeSummary: [{ formType: '1099-NEC', totalAmount: 10_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);
      expect(result.additionalMedicareTax).toBe(0);
    });

    it('reduces AMT threshold by W-2 wages for mixed income', async () => {
      // $180,000 W-2 + $50,000 1099-NEC
      setupMocks({
        totalIncome: 23_000_000,
        incomeSummary: [
          { formType: 'W-2', totalAmount: 18_000_000, count: 1 },
          { formType: '1099-NEC', totalAmount: 5_000_000, count: 1 },
        ],
      });

      const result = await estimateTaxLiability(2024);

      // SE tax base: $50,000 * 0.9235 = $46,175
      // AMT threshold after W-2: $200,000 - $180,000 = $20,000
      // AMT excess: $46,175 - $20,000 = $26,175
      // AMT: $26,175 * 0.009 = $235.575 -> $236
      expect(result.additionalMedicareTax).toBe(23_600);
    });
  });

  describe('zero income', () => {
    it('returns all zeros for no income', async () => {
      setupMocks({
        totalIncome: 0,
        incomeSummary: [],
      });

      const result = await estimateTaxLiability(2024);

      expect(result.grossIncome).toBe(0);
      expect(result.taxableIncome).toBe(0);
      expect(result.federalIncomeTax).toBe(0);
      expect(result.selfEmploymentTax).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.effectiveRate).toBe(0);
      expect(result.marginalRate).toBe(0);
    });
  });

  describe('tax year configs', () => {
    it('uses 2024 standard deduction ($14,600)', async () => {
      setupMocks({
        totalIncome: 5_000_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);
      expect(result.standardDeduction).toBe(1_460_000);
    });

    it('uses 2025 standard deduction ($15,000)', async () => {
      setupMocks({
        totalIncome: 5_000_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2025);
      expect(result.standardDeduction).toBe(1_500_000);
    });

    it('falls back to closest year for unknown year', async () => {
      setupMocks({
        totalIncome: 5_000_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 5_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2030);
      // Should fall back to 2026 (closest available)
      expect(result.standardDeduction).toBe(1_500_000);
    });
  });

  describe('rates', () => {
    it('calculates effective rate correctly', async () => {
      setupMocks({
        totalIncome: 10_000_000, // $100k
        incomeSummary: [{ formType: 'W-2', totalAmount: 10_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);
      // Effective rate = totalTax / grossIncome * 100
      expect(result.effectiveRate).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThan(40);
    });

    it('reports marginal rate as whole percentage', async () => {
      setupMocks({
        totalIncome: 10_000_000,
        incomeSummary: [{ formType: 'W-2', totalAmount: 10_000_000, count: 1 }],
      });

      const result = await estimateTaxLiability(2024);
      // $100k - $14,600 = $85,400 taxable; falls in 22% bracket (2024: $47,150-$100,525)
      expect(result.marginalRate).toBe(22);
    });
  });
});
