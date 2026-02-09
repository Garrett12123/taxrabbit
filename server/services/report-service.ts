import 'server-only';

import {
  getDashboardOverview,
  getIncomeByType,
  getExpenseByCategory,
} from '@/server/services/analytics-service';
import { getDocumentSummary } from '@/server/services/document-service';
import { getMileageSummary } from '@/server/services/mileage-service';
import { getQuarterlyOverview } from '@/server/services/estimated-payments-service';
import { getCompletionStats } from '@/server/db/dal/checklist-items';
import type { SummaryData } from '@/lib/html/summary-template';

export type YearEndSummary = SummaryData;

export async function getYearEndSummary(year: number): Promise<YearEndSummary> {
  const [
    overview,
    incomeByType,
    expByCatPersonal,
    expByCatBusiness,
    docSummary,
    checklistStats,
    mileageSummary,
    estPaymentsOverview,
  ] = await Promise.all([
    getDashboardOverview(year),
    getIncomeByType(year),
    getExpenseByCategory(year, 'personal'),
    getExpenseByCategory(year, 'business'),
    getDocumentSummary(year),
    Promise.resolve(getCompletionStats(year)),
    Promise.resolve(getMileageSummary(year)),
    getQuarterlyOverview(year),
  ]);

  // If a category appears in both personal and business, split into separate rows
  const splitByCategory: SummaryData['expenses']['byCategory'] = [];
  for (const cat of expByCatBusiness) {
    splitByCategory.push({ ...cat, entityType: 'business' });
  }
  for (const cat of expByCatPersonal) {
    splitByCategory.push({ ...cat, entityType: 'personal' });
  }

  return {
    year,
    generatedAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    income: {
      total: overview.totalIncome,
      totalWithholding: overview.totalWithholding,
      byType: incomeByType,
    },
    expenses: {
      totalAll: overview.totalExpenses,
      totalPersonal: overview.totalPersonal,
      totalBusiness: overview.totalBusiness,
      byCategory: splitByCategory,
    },
    mileage: {
      totalMiles: mileageSummary.totalMiles,
      totalTrips: mileageSummary.totalTrips,
      totalDeduction: mileageSummary.totalDeduction,
      ratePerMile: mileageSummary.ratePerMile,
    },
    estimatedPayments: estPaymentsOverview.quarters.map((q) => ({
      quarter: q.quarter,
      label: q.label,
      dueDate: q.dueDate,
      amountPaid: q.amountPaid,
      isPaid: q.isPaid,
    })),
    documents: docSummary,
    checklist: checklistStats,
  };
}
