import 'server-only';

import {
  getTotalIncome,
  getTotalWithholding,
  getIncomeSummaryByType,
  getTotalStateWithholding,
} from '@/server/db/dal/income-documents';
import { getExpenseSummary } from '@/server/services/expense-service';
import { getMileageSummary } from '@/server/services/mileage-service';
import { getFilingStatus, type FilingStatus } from '@/server/db/dal/tax-years';

// ─── Federal Tax Brackets by Year and Filing Status ────────────
// All values in DOLLARS (converted from/to cents at service boundary)

type Bracket = { min: number; max: number; rate: number };

type FilingStatusConfig = {
  brackets: Bracket[];
  standardDeduction: number;
};

type TaxYearConfig = Record<FilingStatus, FilingStatusConfig>;

// 2024 Tax Brackets by Filing Status (IRS Rev. Proc. 2023-34)
const TAX_YEAR_2024: TaxYearConfig = {
  single: {
    brackets: [
      { min: 0, max: 11_600, rate: 0.10 },
      { min: 11_600, max: 47_150, rate: 0.12 },
      { min: 47_150, max: 100_525, rate: 0.22 },
      { min: 100_525, max: 191_950, rate: 0.24 },
      { min: 191_950, max: 243_725, rate: 0.32 },
      { min: 243_725, max: 609_350, rate: 0.35 },
      { min: 609_350, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 14_600,
  },
  mfj: {
    brackets: [
      { min: 0, max: 23_200, rate: 0.10 },
      { min: 23_200, max: 94_300, rate: 0.12 },
      { min: 94_300, max: 201_050, rate: 0.22 },
      { min: 201_050, max: 383_900, rate: 0.24 },
      { min: 383_900, max: 487_450, rate: 0.32 },
      { min: 487_450, max: 731_200, rate: 0.35 },
      { min: 731_200, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 29_200,
  },
  mfs: {
    brackets: [
      { min: 0, max: 11_600, rate: 0.10 },
      { min: 11_600, max: 47_150, rate: 0.12 },
      { min: 47_150, max: 100_525, rate: 0.22 },
      { min: 100_525, max: 191_950, rate: 0.24 },
      { min: 191_950, max: 243_725, rate: 0.32 },
      { min: 243_725, max: 365_600, rate: 0.35 },
      { min: 365_600, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 14_600,
  },
  hoh: {
    brackets: [
      { min: 0, max: 16_550, rate: 0.10 },
      { min: 16_550, max: 63_100, rate: 0.12 },
      { min: 63_100, max: 100_500, rate: 0.22 },
      { min: 100_500, max: 191_950, rate: 0.24 },
      { min: 191_950, max: 243_700, rate: 0.32 },
      { min: 243_700, max: 609_350, rate: 0.35 },
      { min: 609_350, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 21_900,
  },
};

// 2025 Tax Brackets by Filing Status (IRS Rev. Proc. 2024-40)
const TAX_YEAR_2025: TaxYearConfig = {
  single: {
    brackets: [
      { min: 0, max: 11_925, rate: 0.10 },
      { min: 11_925, max: 48_475, rate: 0.12 },
      { min: 48_475, max: 103_350, rate: 0.22 },
      { min: 103_350, max: 197_300, rate: 0.24 },
      { min: 197_300, max: 250_525, rate: 0.32 },
      { min: 250_525, max: 626_350, rate: 0.35 },
      { min: 626_350, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 15_000,
  },
  mfj: {
    brackets: [
      { min: 0, max: 23_850, rate: 0.10 },
      { min: 23_850, max: 96_950, rate: 0.12 },
      { min: 96_950, max: 206_700, rate: 0.22 },
      { min: 206_700, max: 394_600, rate: 0.24 },
      { min: 394_600, max: 501_050, rate: 0.32 },
      { min: 501_050, max: 751_600, rate: 0.35 },
      { min: 751_600, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 30_000,
  },
  mfs: {
    brackets: [
      { min: 0, max: 11_925, rate: 0.10 },
      { min: 11_925, max: 48_475, rate: 0.12 },
      { min: 48_475, max: 103_350, rate: 0.22 },
      { min: 103_350, max: 197_300, rate: 0.24 },
      { min: 197_300, max: 250_525, rate: 0.32 },
      { min: 250_525, max: 375_800, rate: 0.35 },
      { min: 375_800, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 15_000,
  },
  hoh: {
    brackets: [
      { min: 0, max: 17_000, rate: 0.10 },
      { min: 17_000, max: 64_850, rate: 0.12 },
      { min: 64_850, max: 103_350, rate: 0.22 },
      { min: 103_350, max: 197_300, rate: 0.24 },
      { min: 197_300, max: 250_500, rate: 0.32 },
      { min: 250_500, max: 626_350, rate: 0.35 },
      { min: 626_350, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 22_500,
  },
};

// Use 2025 as placeholder for 2026 until IRS publishes
const TAX_YEAR_2026 = TAX_YEAR_2025;

// Historical years — explicit IRS brackets for all filing statuses
// Source: IRS Revenue Procedures for each tax year

// 2020 Tax Brackets (IRS Rev. Proc. 2019-44)
const TAX_YEAR_2020: TaxYearConfig = {
  single: {
    brackets: [
      { min: 0, max: 9_875, rate: 0.10 },
      { min: 9_875, max: 40_125, rate: 0.12 },
      { min: 40_125, max: 85_525, rate: 0.22 },
      { min: 85_525, max: 163_300, rate: 0.24 },
      { min: 163_300, max: 207_350, rate: 0.32 },
      { min: 207_350, max: 518_400, rate: 0.35 },
      { min: 518_400, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 12_400,
  },
  mfj: {
    brackets: [
      { min: 0, max: 19_750, rate: 0.10 },
      { min: 19_750, max: 80_250, rate: 0.12 },
      { min: 80_250, max: 171_050, rate: 0.22 },
      { min: 171_050, max: 326_600, rate: 0.24 },
      { min: 326_600, max: 414_700, rate: 0.32 },
      { min: 414_700, max: 622_050, rate: 0.35 },
      { min: 622_050, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 24_800,
  },
  mfs: {
    brackets: [
      { min: 0, max: 9_875, rate: 0.10 },
      { min: 9_875, max: 40_125, rate: 0.12 },
      { min: 40_125, max: 85_525, rate: 0.22 },
      { min: 85_525, max: 163_300, rate: 0.24 },
      { min: 163_300, max: 207_350, rate: 0.32 },
      { min: 207_350, max: 311_025, rate: 0.35 },
      { min: 311_025, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 12_400,
  },
  hoh: {
    brackets: [
      { min: 0, max: 14_100, rate: 0.10 },
      { min: 14_100, max: 53_700, rate: 0.12 },
      { min: 53_700, max: 85_500, rate: 0.22 },
      { min: 85_500, max: 163_300, rate: 0.24 },
      { min: 163_300, max: 207_350, rate: 0.32 },
      { min: 207_350, max: 518_400, rate: 0.35 },
      { min: 518_400, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 18_650,
  },
};

// 2021 Tax Brackets (IRS Rev. Proc. 2020-45)
const TAX_YEAR_2021: TaxYearConfig = {
  single: {
    brackets: [
      { min: 0, max: 9_950, rate: 0.10 },
      { min: 9_950, max: 40_525, rate: 0.12 },
      { min: 40_525, max: 86_375, rate: 0.22 },
      { min: 86_375, max: 164_925, rate: 0.24 },
      { min: 164_925, max: 209_425, rate: 0.32 },
      { min: 209_425, max: 523_600, rate: 0.35 },
      { min: 523_600, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 12_550,
  },
  mfj: {
    brackets: [
      { min: 0, max: 19_900, rate: 0.10 },
      { min: 19_900, max: 81_050, rate: 0.12 },
      { min: 81_050, max: 172_750, rate: 0.22 },
      { min: 172_750, max: 329_850, rate: 0.24 },
      { min: 329_850, max: 418_850, rate: 0.32 },
      { min: 418_850, max: 628_300, rate: 0.35 },
      { min: 628_300, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 25_100,
  },
  mfs: {
    brackets: [
      { min: 0, max: 9_950, rate: 0.10 },
      { min: 9_950, max: 40_525, rate: 0.12 },
      { min: 40_525, max: 86_375, rate: 0.22 },
      { min: 86_375, max: 164_925, rate: 0.24 },
      { min: 164_925, max: 209_425, rate: 0.32 },
      { min: 209_425, max: 314_150, rate: 0.35 },
      { min: 314_150, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 12_550,
  },
  hoh: {
    brackets: [
      { min: 0, max: 14_200, rate: 0.10 },
      { min: 14_200, max: 54_200, rate: 0.12 },
      { min: 54_200, max: 86_350, rate: 0.22 },
      { min: 86_350, max: 164_900, rate: 0.24 },
      { min: 164_900, max: 209_400, rate: 0.32 },
      { min: 209_400, max: 523_600, rate: 0.35 },
      { min: 523_600, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 18_800,
  },
};

// 2022 Tax Brackets (IRS Rev. Proc. 2021-45)
const TAX_YEAR_2022: TaxYearConfig = {
  single: {
    brackets: [
      { min: 0, max: 10_275, rate: 0.10 },
      { min: 10_275, max: 41_775, rate: 0.12 },
      { min: 41_775, max: 89_075, rate: 0.22 },
      { min: 89_075, max: 170_050, rate: 0.24 },
      { min: 170_050, max: 215_950, rate: 0.32 },
      { min: 215_950, max: 539_900, rate: 0.35 },
      { min: 539_900, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 12_950,
  },
  mfj: {
    brackets: [
      { min: 0, max: 20_550, rate: 0.10 },
      { min: 20_550, max: 83_550, rate: 0.12 },
      { min: 83_550, max: 178_150, rate: 0.22 },
      { min: 178_150, max: 340_100, rate: 0.24 },
      { min: 340_100, max: 431_900, rate: 0.32 },
      { min: 431_900, max: 647_850, rate: 0.35 },
      { min: 647_850, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 25_900,
  },
  mfs: {
    brackets: [
      { min: 0, max: 10_275, rate: 0.10 },
      { min: 10_275, max: 41_775, rate: 0.12 },
      { min: 41_775, max: 89_075, rate: 0.22 },
      { min: 89_075, max: 170_050, rate: 0.24 },
      { min: 170_050, max: 215_950, rate: 0.32 },
      { min: 215_950, max: 323_925, rate: 0.35 },
      { min: 323_925, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 12_950,
  },
  hoh: {
    brackets: [
      { min: 0, max: 14_650, rate: 0.10 },
      { min: 14_650, max: 55_900, rate: 0.12 },
      { min: 55_900, max: 89_050, rate: 0.22 },
      { min: 89_050, max: 170_050, rate: 0.24 },
      { min: 170_050, max: 215_950, rate: 0.32 },
      { min: 215_950, max: 539_900, rate: 0.35 },
      { min: 539_900, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 19_400,
  },
};

// 2023 Tax Brackets (IRS Rev. Proc. 2022-38)
const TAX_YEAR_2023: TaxYearConfig = {
  single: {
    brackets: [
      { min: 0, max: 11_000, rate: 0.10 },
      { min: 11_000, max: 44_725, rate: 0.12 },
      { min: 44_725, max: 95_375, rate: 0.22 },
      { min: 95_375, max: 182_100, rate: 0.24 },
      { min: 182_100, max: 231_250, rate: 0.32 },
      { min: 231_250, max: 578_125, rate: 0.35 },
      { min: 578_125, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 13_850,
  },
  mfj: {
    brackets: [
      { min: 0, max: 22_000, rate: 0.10 },
      { min: 22_000, max: 89_450, rate: 0.12 },
      { min: 89_450, max: 190_750, rate: 0.22 },
      { min: 190_750, max: 364_200, rate: 0.24 },
      { min: 364_200, max: 462_500, rate: 0.32 },
      { min: 462_500, max: 693_750, rate: 0.35 },
      { min: 693_750, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 27_700,
  },
  mfs: {
    brackets: [
      { min: 0, max: 11_000, rate: 0.10 },
      { min: 11_000, max: 44_725, rate: 0.12 },
      { min: 44_725, max: 95_375, rate: 0.22 },
      { min: 95_375, max: 182_100, rate: 0.24 },
      { min: 182_100, max: 231_250, rate: 0.32 },
      { min: 231_250, max: 346_875, rate: 0.35 },
      { min: 346_875, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 13_850,
  },
  hoh: {
    brackets: [
      { min: 0, max: 15_700, rate: 0.10 },
      { min: 15_700, max: 59_850, rate: 0.12 },
      { min: 59_850, max: 95_350, rate: 0.22 },
      { min: 95_350, max: 182_100, rate: 0.24 },
      { min: 182_100, max: 231_250, rate: 0.32 },
      { min: 231_250, max: 578_100, rate: 0.35 },
      { min: 578_100, max: Infinity, rate: 0.37 },
    ],
    standardDeduction: 20_800,
  },
};

const TAX_YEAR_CONFIGS: Record<number, TaxYearConfig> = {
  2020: TAX_YEAR_2020,
  2021: TAX_YEAR_2021,
  2022: TAX_YEAR_2022,
  2023: TAX_YEAR_2023,
  2024: TAX_YEAR_2024,
  2025: TAX_YEAR_2025,
  2026: TAX_YEAR_2026,
};

function getTaxYearConfig(year: number, filingStatus: FilingStatus): FilingStatusConfig {
  const yearConfig = TAX_YEAR_CONFIGS[year];
  if (!yearConfig) {
    // Fall back to closest available year
    const years = Object.keys(TAX_YEAR_CONFIGS).map(Number).sort((a, b) => a - b);
    const closest = years.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    );
    return TAX_YEAR_CONFIGS[closest]![filingStatus];
  }
  return yearConfig[filingStatus];
}

const SS_TAX_RATE = 0.124; // 12.4% Social Security portion
const MEDICARE_TAX_RATE = 0.029; // 2.9% Medicare portion
const SE_DEDUCTION_RATE = 0.5; // Deduct half of SE tax from income
const ADDITIONAL_MEDICARE_TAX_RATE = 0.009; // 0.9% Additional Medicare Tax

// Additional Medicare Tax thresholds by filing status (unchanged since 2013)
const AMT_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200_000,
  mfj: 250_000,
  mfs: 125_000,
  hoh: 200_000,
};

// Social Security wage base by year
const SS_WAGE_BASE: Record<number, number> = {
  2020: 137_700,
  2021: 142_800,
  2022: 147_000,
  2023: 160_200,
  2024: 168_600,
  2025: 176_100,
  2026: 176_100, // Placeholder: not yet published
};

// ─── Types ───────────────────────────────────────────────────

export type TaxEstimate = {
  grossIncome: number; // cents
  selfEmploymentIncome: number; // cents
  businessExpenses: number; // cents
  mileageDeduction: number; // cents
  standardDeduction: number; // cents
  taxableIncome: number; // cents
  selfEmploymentTax: number; // cents
  additionalMedicareTax: number; // cents — 0.9% on SE income exceeding threshold
  federalIncomeTax: number; // cents
  stateWithholding: number; // cents — total state tax withheld from income docs
  totalTax: number; // cents
  totalWithholding: number; // cents — federal + state withholding combined
  estimatedOwed: number; // cents (negative = refund)
  effectiveRate: number; // percentage 0-100
  marginalRate: number; // percentage 0-100
  filingStatus: FilingStatus;
};

export { type FilingStatus } from '@/server/db/dal/tax-years';

// ─── Tax Calculation ─────────────────────────────────────────

function calculateFederalTax(
  taxableIncomeDollars: number,
  brackets: Bracket[]
): {
  tax: number;
  marginalRate: number;
} {
  if (taxableIncomeDollars <= 0) return { tax: 0, marginalRate: 0 };

  let tax = 0;
  let marginalRate = 0;

  for (const bracket of brackets) {
    if (taxableIncomeDollars <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncomeDollars, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
    marginalRate = bracket.rate;
  }

  return { tax: Math.round(tax), marginalRate };
}

export function estimateTaxLiability(year: number): TaxEstimate {
  const filingStatus = getFilingStatus(year);
  const config = getTaxYearConfig(year, filingStatus);
  const grossIncome = getTotalIncome(year); // cents
  const fedWithholding = getTotalWithholding(year); // cents
  const stateWithholding = getTotalStateWithholding(year); // cents
  const totalWithholding = fedWithholding + stateWithholding;
  const incomeByType = getIncomeSummaryByType(year);
  const expenseSummary = getExpenseSummary(year);
  const mileageSummary = getMileageSummary(year);
  const mileageDeduction = mileageSummary.totalDeduction; // cents

  // Self-employment income: 1099-NEC, 1099-MISC, 1099-K (gig/marketplace income)
  const seTypes = ['1099-NEC', '1099-MISC', '1099-K'];
  const selfEmploymentIncome = incomeByType
    .filter((r) => seTypes.includes(r.formType))
    .reduce((sum, r) => sum + r.totalAmount, 0); // cents

  const businessExpenses = expenseSummary.totalBusiness; // cents

  // Total business deductions = business expenses + mileage deduction
  const totalBusinessDeductions = businessExpenses + mileageDeduction; // cents

  // Convert to dollars for bracket calculation
  const grossDollars = grossIncome / 100;
  const seDollars = selfEmploymentIncome / 100;
  const bizDeductDollars = totalBusinessDeductions / 100;

  // Net SE income after business deductions (expenses + mileage)
  // Allow negative (Schedule C net loss offsets other income for AGI)
  const netSeDollars = seDollars - bizDeductDollars;

  // Self-employment tax (on 92.35% of net SE income per IRS rules)
  // SE tax only applies when net SE income is positive
  const seTaxBaseDollars = Math.max(netSeDollars, 0) * 0.9235;

  // Apply Social Security wage base cap:
  // SS (12.4%) only applies on income up to the wage base, accounting for W-2 wages
  const ssWageBase = SS_WAGE_BASE[year] ?? SS_WAGE_BASE[2026]!;
  // Compute actual W-2 wages from the income breakdown (not grossIncome - SE)
  // to avoid including investment income (1099-INT, 1099-DIV) in the W-2 estimate
  const w2WagesDollars = incomeByType
    .filter((r) => r.formType === 'W-2')
    .reduce((sum, r) => sum + r.totalAmount, 0) / 100;
  const ssRoomDollars = Math.max(ssWageBase - w2WagesDollars, 0);
  const ssTaxDollars = Math.min(seTaxBaseDollars, ssRoomDollars) * SS_TAX_RATE;
  const medicareTaxDollars = seTaxBaseDollars * MEDICARE_TAX_RATE;
  const seTaxDollars = Math.round(ssTaxDollars + medicareTaxDollars);

  // Additional Medicare Tax (0.9%) on SE income exceeding the filing-status threshold.
  // W-2 wages "fill up" the threshold first, so only SE income beyond the remaining
  // threshold is taxed. W-2-only AMT is already handled by employer payroll withholding.
  const amtThreshold = AMT_THRESHOLDS[filingStatus];
  const amtSeThresholdDollars = Math.max(amtThreshold - w2WagesDollars, 0);
  const amtSeExcessDollars = Math.max(seTaxBaseDollars - amtSeThresholdDollars, 0);
  const additionalMedicareTaxDollars = Math.round(amtSeExcessDollars * ADDITIONAL_MEDICARE_TAX_RATE);

  // AGI = non-SE income + net SE income - half of SE tax
  const nonSeDollars = grossDollars - seDollars;
  const seDeductionDollars = Math.round(seTaxDollars * SE_DEDUCTION_RATE);
  const adjustedGrossDollars = nonSeDollars + netSeDollars - seDeductionDollars;
  const taxableIncomeDollars = Math.max(
    adjustedGrossDollars - config.standardDeduction,
    0
  );

  const { tax: federalTaxDollars, marginalRate } = calculateFederalTax(
    taxableIncomeDollars,
    config.brackets
  );

  const totalTaxDollars = federalTaxDollars + seTaxDollars + additionalMedicareTaxDollars;
  const effectiveRate = grossDollars > 0 ? (totalTaxDollars / grossDollars) * 100 : 0;

  // Convert back to cents
  const totalTaxCents = Math.round(totalTaxDollars * 100);
  const seTaxCents = Math.round(seTaxDollars * 100);
  const additionalMedicareTaxCents = Math.round(additionalMedicareTaxDollars * 100);
  const federalTaxCents = Math.round(federalTaxDollars * 100);
  const taxableIncomeCents = Math.round(taxableIncomeDollars * 100);
  const standardDeductionCents = Math.round(config.standardDeduction * 100);
  // Only subtract federal withholding from federal tax estimate
  // (state withholding applies to state tax which is not estimated here)
  const estimatedOwed = totalTaxCents - fedWithholding;

  return {
    grossIncome,
    selfEmploymentIncome,
    businessExpenses,
    mileageDeduction,
    standardDeduction: standardDeductionCents,
    taxableIncome: taxableIncomeCents,
    selfEmploymentTax: seTaxCents,
    additionalMedicareTax: additionalMedicareTaxCents,
    federalIncomeTax: federalTaxCents,
    stateWithholding,
    totalTax: totalTaxCents,
    totalWithholding,
    estimatedOwed,
    effectiveRate: Math.round(effectiveRate * 10) / 10,
    marginalRate: Math.round(marginalRate * 100),
    filingStatus,
  };
}
