'use server';

import { formatErrorForUser } from '@/lib/errors';
import { searchAll, type SearchResult } from '@/server/services/search-service';

export async function searchAction(
  year: number,
  query: string
): Promise<{ results: SearchResult[]; error?: string }> {
  try {
    const results = await searchAll(year, query);
    return { results };
  } catch (err) {
    return { results: [], error: formatErrorForUser(err) };
  }
}
