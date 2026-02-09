import 'server-only';

import {
  createExpense,
  updateExpense,
  getExpense,
  listExpensesByYear,
  deleteExpense,
  getMonthlyTotals,
  getCategoryTotals,
  type ExpensePayload,
  type ExpenseDecrypted,
} from '@/server/db/dal/expenses';
import type { ExpenseInput } from '@/lib/validation/expense';

export type ExpenseSummary = {
  totalAll: number;
  totalPersonal: number;
  totalBusiness: number;
  expenseCount: number;
};

export async function createExpenseFromInput(
  input: ExpenseInput
): Promise<string> {
  const payload: ExpensePayload = {
    vendor: input.vendor,
    description: input.description,
    notes: input.notes,
    paymentMethod: input.paymentMethod,
    tags: input.tags,
    receiptRef: input.receiptRef,
  };

  return createExpense({
    year: input.year,
    date: input.date,
    amount: input.amount,
    category: input.category,
    entityType: input.entityType,
    payload,
  });
}

export async function updateExpenseFromInput(
  id: string,
  input: ExpenseInput
): Promise<void> {
  const payload: ExpensePayload = {
    vendor: input.vendor,
    description: input.description,
    notes: input.notes,
    paymentMethod: input.paymentMethod,
    tags: input.tags,
    receiptRef: input.receiptRef,
  };

  return updateExpense(id, {
    date: input.date,
    amount: input.amount,
    category: input.category,
    entityType: input.entityType,
    payload,
  });
}

export function getExpenseSummary(year: number): ExpenseSummary {
  const allTotals = getCategoryTotals(year);
  const personalTotals = getCategoryTotals(year, 'personal');
  const businessTotals = getCategoryTotals(year, 'business');

  const totalAll = allTotals.reduce((sum, r) => sum + r.total, 0);
  const totalPersonal = personalTotals.reduce((sum, r) => sum + r.total, 0);
  const totalBusiness = businessTotals.reduce((sum, r) => sum + r.total, 0);
  const expenseCount = allTotals.reduce((sum, r) => sum + r.count, 0);

  return { totalAll, totalPersonal, totalBusiness, expenseCount };
}

// Re-export DAL query functions
export {
  getExpense,
  listExpensesByYear,
  deleteExpense,
  getMonthlyTotals,
  getCategoryTotals,
};
export type { ExpenseDecrypted };
