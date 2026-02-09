import 'server-only';

import {
  getTotalIncome,
  getTotalWithholding,
  getIncomeSummaryByType,
  getIncomeMonthlyTotals,
  getIncomeDocumentCount,
  listIncomeDocumentsByYear,
  listRecentIncomeDocuments,
  getWithholdingMonthlyTotals,
  getIncomeByEntityType,
} from '@/server/db/dal/income-documents';
import {
  getCategoryTotals,
  getMonthlyTotals,
  listExpensesByYear,
  listRecentExpenses,
} from '@/server/db/dal/expenses';
import { getExpenseSummary } from '@/server/services/expense-service';
import { getDocumentSummary } from '@/server/services/document-service';
import { getCompletionStats } from '@/server/db/dal/checklist-items';
import { getQuarterlyOverview } from '@/server/services/estimated-payments-service';

function formatCentsForMissing(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// ─── Types ──────────────────────────────────────────────────────

export type DashboardOverview = {
  totalIncome: number;
  totalWithholding: number;
  totalExpenses: number;
  totalBusiness: number;
  totalPersonal: number;
  formCount: number;
  docCount: number;
  unlinkedDocs: number;
  checklistStats: { total: number; completed: number };
};

export type MissingItem = {
  label: string;
  description: string;
  href: string;
  severity: 'warning' | 'info';
};

export type RecentActivityItem = {
  type: 'income' | 'expense' | 'document';
  label: string;
  amount?: number;
  date: string;
  href: string;
};

// ─── Dashboard Overview ─────────────────────────────────────────

export async function getDashboardOverview(
  year: number
): Promise<DashboardOverview> {
  const totalIncome = getTotalIncome(year);
  const totalWithholding = getTotalWithholding(year);
  const expenseSummary = getExpenseSummary(year);
  const formCount = getIncomeDocumentCount(year);
  const docSummary = await getDocumentSummary(year);
  const checklistStats = getCompletionStats(year);

  return {
    totalIncome,
    totalWithholding,
    totalExpenses: expenseSummary.totalAll,
    totalBusiness: expenseSummary.totalBusiness,
    totalPersonal: expenseSummary.totalPersonal,
    formCount,
    docCount: docSummary.totalCount,
    unlinkedDocs: docSummary.unlinkedCount,
    checklistStats,
  };
}

// ─── Income Aggregations ────────────────────────────────────────

export function getIncomeByType(
  year: number
): { formType: string; totalAmount: number; count: number }[] {
  return getIncomeSummaryByType(year);
}

export async function getIncomeByPayer(
  year: number
): Promise<{ payerName: string; totalAmount: number; count: number }[]> {
  const docs = await listIncomeDocumentsByYear(year);

  const grouped = new Map<string, { totalAmount: number; count: number }>();
  for (const doc of docs) {
    const name = doc.payload.issuerName || 'Unknown';
    const existing = grouped.get(name);
    if (existing) {
      existing.totalAmount += doc.amount;
      existing.count += 1;
    } else {
      grouped.set(name, { totalAmount: doc.amount, count: 1 });
    }
  }

  return Array.from(grouped.entries())
    .map(([payerName, data]) => ({ payerName, ...data }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export function getIncomeMonthly(
  year: number
): { month: string; total: number }[] {
  return getIncomeMonthlyTotals(year);
}

export function getIncomeWithholdingMonthly(
  year: number
): { month: string; fedWithholding: number; stateWithholding: number }[] {
  return getWithholdingMonthlyTotals(year);
}

export function getIncomeByEntity(
  year: number
): { entityType: string; totalAmount: number; count: number }[] {
  return getIncomeByEntityType(year);
}

// ─── Expense Aggregations ───────────────────────────────────────

export function getExpenseByCategory(
  year: number,
  entityType?: 'personal' | 'business'
): { category: string; total: number; count: number }[] {
  return getCategoryTotals(year, entityType);
}

export function getExpenseMonthly(
  year: number
): { month: string; total: number }[] {
  return getMonthlyTotals(year);
}

export async function getExpenseByVendor(
  year: number,
  limit = 10
): Promise<{ vendor: string; total: number; count: number }[]> {
  const expenses = await listExpensesByYear(year);

  const grouped = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    const name = exp.payload.vendor || 'Unknown';
    const existing = grouped.get(name);
    if (existing) {
      existing.total += exp.amount;
      existing.count += 1;
    } else {
      grouped.set(name, { total: exp.amount, count: 1 });
    }
  }

  return Array.from(grouped.entries())
    .map(([vendor, data]) => ({ vendor, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ─── Missing Items ──────────────────────────────────────────────

export async function getMissingItems(
  year: number
): Promise<MissingItem[]> {
  const items: MissingItem[] = [];

  const formCount = getIncomeDocumentCount(year);
  const totalIncome = getTotalIncome(year);
  const expenseSummary = getExpenseSummary(year);
  const docSummary = await getDocumentSummary(year);
  const incomeByType = getIncomeSummaryByType(year);

  const hasW2 = incomeByType.some((r) => r.formType === 'W-2');

  if (formCount === 0) {
    items.push({
      label: 'No income forms',
      description: 'Add at least one W-2 or 1099 form for this tax year.',
      href: '/income',
      severity: 'warning',
    });
  } else if (!hasW2 && totalIncome > 0) {
    items.push({
      label: 'No W-2 recorded',
      description: 'If you have wage income, add your W-2 form.',
      href: '/income',
      severity: 'info',
    });
  }

  if (docSummary.unlinkedCount > 0) {
    items.push({
      label: `${docSummary.unlinkedCount} unlinked document${docSummary.unlinkedCount > 1 ? 's' : ''}`,
      description: 'Link documents to income forms or expenses for better organization.',
      href: '/documents',
      severity: 'info',
    });
  }

  if (formCount > 0) {
    // Check for incomplete forms among income docs
    const docs = await listIncomeDocumentsByYear(year);
    const { computeCompleteness } = await import('@/lib/completeness');
    const { INCOME_FORM_TYPES } = await import('@/lib/constants');
    const incomplete = docs.filter((doc) => {
      if (!INCOME_FORM_TYPES.includes(doc.formType as typeof INCOME_FORM_TYPES[number])) return false;
      const result = computeCompleteness(
        doc.formType as typeof INCOME_FORM_TYPES[number],
        doc.payload.boxes ?? {},
        doc.payload.issuerName
      );
      return result.status !== 'complete';
    });

    if (incomplete.length > 0) {
      items.push({
        label: `${incomplete.length} incomplete form${incomplete.length > 1 ? 's' : ''}`,
        description: 'Some income forms are missing required fields.',
        href: '/income',
        severity: 'warning',
      });
    }
  }

  if (expenseSummary.expenseCount > 0 && docSummary.totalCount === 0) {
    items.push({
      label: 'No receipts uploaded',
      description: 'Upload receipts for your expenses to strengthen deduction records.',
      href: '/documents',
      severity: 'info',
    });
  }

  // Check for overdue quarterly estimated payments
  try {
    const quarterly = await getQuarterlyOverview(year);
    const overdueCount = quarterly.quarters.filter((q) => q.isOverdue).length;
    if (overdueCount > 0) {
      items.push({
        label: `${overdueCount} overdue estimated payment${overdueCount > 1 ? 's' : ''}`,
        description: 'Record your quarterly estimated tax payments to avoid IRS penalties.',
        href: '/estimated-payments',
        severity: 'warning',
      });
    } else if (quarterly.nextDueQuarter) {
      items.push({
        label: `Q${quarterly.nextDueQuarter.quarter} payment due ${quarterly.nextDueQuarter.dueDate}`,
        description: `Estimated payment of ${formatCentsForMissing(quarterly.nextDueQuarter.recommendedAmount)} recommended.`,
        href: '/estimated-payments',
        severity: 'info',
      });
    }
  } catch {
    // Skip quarterly check if it fails (e.g., no self-employment income)
  }

  return items;
}

// ─── Recent Activity ────────────────────────────────────────────

export async function getRecentActivity(
  year: number,
  limit = 8
): Promise<RecentActivityItem[]> {
  // Only decrypt the most recent records instead of all records for the year
  const [incomeDocs, recentExpenses] = await Promise.all([
    listRecentIncomeDocuments(year, limit),
    listRecentExpenses(year, limit),
  ]);

  const items: RecentActivityItem[] = [];

  for (const doc of incomeDocs) {
    items.push({
      type: 'income',
      label: `${doc.formType} — ${doc.payload.issuerName || 'Unknown'}`,
      amount: doc.amount,
      date: doc.createdAt,
      href: `/income/${doc.id}`,
    });
  }

  for (const exp of recentExpenses) {
    items.push({
      type: 'expense',
      label: `${exp.category} — ${exp.payload.vendor || 'Unknown'}`,
      amount: exp.amount,
      date: exp.createdAt,
      href: `/expenses`,
    });
  }

  // Sort by date descending and limit (ISO 8601 strings sort correctly with < >)
  items.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
  return items.slice(0, limit);
}
