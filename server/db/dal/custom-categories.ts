import 'server-only';

import { eq, and, count } from 'drizzle-orm';

import { getDb } from '@/server/db';
import { customCategories, expenses } from '@/server/db/schema';
import { generateId, nowISO } from './helpers';
import { ValidationError } from '@/lib/errors';

export type CustomCategoryRecord = typeof customCategories.$inferSelect;

export function listCustomCategories(year: number): CustomCategoryRecord[] {
  const db = getDb();
  return db
    .select()
    .from(customCategories)
    .where(eq(customCategories.year, year))
    .all();
}

export function createCustomCategory(year: number, name: string): string {
  const db = getDb();

  // Check for duplicate name in the same year (case-insensitive)
  const allForYear = db
    .select({ id: customCategories.id, name: customCategories.name })
    .from(customCategories)
    .where(eq(customCategories.year, year))
    .all();

  const existing = allForYear.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    throw new ValidationError(`Category "${existing.name}" already exists for this year.`);
  }

  const id = generateId();
  const now = nowISO();

  db.insert(customCategories)
    .values({ id, year, name, createdAt: now })
    .run();

  return id;
}

export function deleteCustomCategory(id: string): void {
  const db = getDb();

  // Look up the category to get its name and year
  const category = db
    .select()
    .from(customCategories)
    .where(eq(customCategories.id, id))
    .get();

  if (category) {
    // Check if any expenses use this category
    const result = db
      .select({ total: count() })
      .from(expenses)
      .where(
        and(
          eq(expenses.year, category.year),
          eq(expenses.category, category.name)
        )
      )
      .get();

    if (result && result.total > 0) {
      throw new ValidationError(
        `Cannot delete "${category.name}" — ${result.total} expense${result.total > 1 ? 's' : ''} use this category. Reassign them first.`
      );
    }
  }

  db.delete(customCategories).where(eq(customCategories.id, id)).run();
}
