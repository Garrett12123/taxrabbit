import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the service
vi.mock('@/server/db/dal/utility-bills', () => ({
  getTotalUtilityCost: vi.fn(),
  getUtilityBillCount: vi.fn(),
  getMonthlyUtilityTotals: vi.fn(),
  getUtilityTotalsByType: vi.fn(),
}));

vi.mock('@/server/services/business-service', () => ({
  getBusinessProfileForYear: vi.fn(),
}));

import { getUtilitySummary, getUtilityDeduction } from '@/server/services/utility-service';
import {
  getTotalUtilityCost,
  getUtilityBillCount,
  getMonthlyUtilityTotals,
  getUtilityTotalsByType,
} from '@/server/db/dal/utility-bills';
import { getBusinessProfileForYear } from '@/server/services/business-service';

const mockGetTotalUtilityCost = vi.mocked(getTotalUtilityCost);
const mockGetUtilityBillCount = vi.mocked(getUtilityBillCount);
const mockGetMonthlyUtilityTotals = vi.mocked(getMonthlyUtilityTotals);
const mockGetUtilityTotalsByType = vi.mocked(getUtilityTotalsByType);
const mockGetBusinessProfileForYear = vi.mocked(getBusinessProfileForYear);

function setupMocks(opts: {
  totalCost?: number;
  billCount?: number;
  homeOfficePercent?: number;
  hasBusinessProfile?: boolean;
}) {
  mockGetTotalUtilityCost.mockReturnValue(opts.totalCost ?? 0);
  mockGetUtilityBillCount.mockReturnValue(opts.billCount ?? 0);
  mockGetMonthlyUtilityTotals.mockReturnValue([]);
  mockGetUtilityTotalsByType.mockReturnValue([]);

  if (opts.hasBusinessProfile === false) {
    mockGetBusinessProfileForYear.mockResolvedValue(null);
  } else {
    mockGetBusinessProfileForYear.mockResolvedValue({
      id: 'bp-1',
      year: 2024,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      payload: {
        businessName: 'Test LLC',
        homeOfficePercent: opts.homeOfficePercent,
      },
    });
  }
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getUtilitySummary', () => {
  it('calculates correct totals with 15% home office', async () => {
    setupMocks({
      totalCost: 800_000, // $8,000
      billCount: 12,
      homeOfficePercent: 15,
    });

    const result = await getUtilitySummary(2024);

    expect(result.totalCost).toBe(800_000);
    expect(result.billCount).toBe(12);
    expect(result.homeOfficePercent).toBe(15);
    // $8,000 * 15% = $1,200
    expect(result.businessDeduction).toBe(120_000);
  });

  it('returns zero deduction when home office percent is 0', async () => {
    setupMocks({
      totalCost: 500_000,
      billCount: 5,
      homeOfficePercent: 0,
    });

    const result = await getUtilitySummary(2024);

    expect(result.businessDeduction).toBe(0);
    expect(result.homeOfficePercent).toBe(0);
  });

  it('returns zero deduction when no business profile exists', async () => {
    setupMocks({
      totalCost: 500_000,
      billCount: 5,
      hasBusinessProfile: false,
    });

    const result = await getUtilitySummary(2024);

    expect(result.businessDeduction).toBe(0);
    expect(result.homeOfficePercent).toBe(0);
  });

  it('handles undefined homeOfficePercent in payload', async () => {
    setupMocks({
      totalCost: 500_000,
      billCount: 5,
      homeOfficePercent: undefined,
    });

    const result = await getUtilitySummary(2024);

    expect(result.businessDeduction).toBe(0);
    expect(result.homeOfficePercent).toBe(0);
  });
});

describe('getUtilityDeduction', () => {
  it('returns correct deduction with percentage', async () => {
    setupMocks({
      totalCost: 1_200_000, // $12,000
      homeOfficePercent: 20,
    });

    const result = await getUtilityDeduction(2024);

    // $12,000 * 20% = $2,400
    expect(result).toBe(240_000);
  });

  it('rounds to nearest cent', async () => {
    setupMocks({
      totalCost: 100_033, // $1,000.33
      homeOfficePercent: 15,
    });

    const result = await getUtilityDeduction(2024);

    // $1,000.33 * 15% = $150.0495 -> rounds to $150.05 = 15005 cents
    expect(result).toBe(Math.round((100_033 * 15) / 100));
  });

  it('returns zero when no bills', async () => {
    setupMocks({
      totalCost: 0,
      homeOfficePercent: 25,
    });

    const result = await getUtilityDeduction(2024);

    expect(result).toBe(0);
  });

  it('returns zero when no business profile', async () => {
    setupMocks({
      totalCost: 500_000,
      hasBusinessProfile: false,
    });

    const result = await getUtilityDeduction(2024);

    expect(result).toBe(0);
  });
});
