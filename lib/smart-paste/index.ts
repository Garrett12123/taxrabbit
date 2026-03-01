import type { IncomeFormType } from '@/lib/constants';
import { extractTokens } from './extract';
import { matchTokensToBoxes } from './match';
import type { SmartPasteResult } from './types';

export type { Token, MatchResult, SmartPasteResult, Confidence } from './types';

/**
 * Smart paste: extract tokens from pasted text and match them to form fields.
 * Runs entirely client-side with regex + keyword matching.
 */
export function smartPaste(
  text: string,
  formType: IncomeFormType
): SmartPasteResult {
  const tokens = extractTokens(text);
  return matchTokensToBoxes(tokens, formType, text);
}
