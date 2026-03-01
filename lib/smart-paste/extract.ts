import { parseDollarsToCents } from '@/lib/utils';
import type { Token } from './types';

const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
]);

// Words that look like state codes but aren't in tax form context
const STATE_FALSE_POSITIVES = new Set([
  'NO', 'OR', 'IN', 'IS', 'IT', 'TO', 'DO', 'IF', 'ON', 'AT',
  'AN', 'AS', 'BY', 'MY', 'UP', 'GO', 'SO', 'OF', 'BE', 'AM',
  'US', 'ID',
]);

/**
 * Extract tokens from pasted text for smart paste matching.
 */
export function extractTokens(text: string): Token[] {
  const tokens: Token[] = [];
  const normalizedText = text.replace(/\r\n/g, '\n');

  // Extract dollar amounts: $1,234.56 or 1,234.56 or 1234.56
  // Must have digits; optional $ prefix; optional commas; optional decimal
  const moneyRegex = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b|\b\d+\.\d{2}\b/g;
  let match: RegExpExecArray | null;

  while ((match = moneyRegex.exec(normalizedText)) !== null) {
    const raw = match[0];
    const cents = parseDollarsToCents(raw);
    if (cents !== null && cents >= 0) {
      tokens.push({
        type: 'money',
        value: cents,
        raw,
        position: match.index,
      });
    }
  }

  // Extract EINs: XX-XXXXXXX (2 digits, dash, 7 digits)
  const einRegex = /\b(\d{2}-\d{7})\b/g;
  while ((match = einRegex.exec(normalizedText)) !== null) {
    tokens.push({
      type: 'ein',
      value: match[1],
      raw: match[0],
      position: match.index,
    });
  }

  // Extract state codes: 2-letter uppercase codes near state-related context
  const stateRegex = /\b([A-Z]{2})\b/g;
  while ((match = stateRegex.exec(normalizedText)) !== null) {
    const code = match[1];
    if (!US_STATES.has(code)) continue;
    if (STATE_FALSE_POSITIVES.has(code)) {
      // Only accept if near a state-related keyword
      const nearby = normalizedText.slice(
        Math.max(0, match.index - 80),
        match.index + 80
      ).toLowerCase();
      const hasContext = /state|employer|payer|address|city|zip/.test(nearby);
      if (!hasContext) continue;
    }
    tokens.push({
      type: 'state',
      value: code,
      raw: match[0],
      position: match.index,
    });
  }

  // Extract checkbox indicators near box 13 labels
  const checkboxRegex = /\b(statutory\s+employee|retirement\s+plan|third[- ]party\s+sick\s+pay)\b/gi;
  while ((match = checkboxRegex.exec(normalizedText)) !== null) {
    // Look for X, Yes, or checkmark near the label
    const nearby = normalizedText.slice(
      Math.max(0, match.index - 20),
      match.index + match[0].length + 20
    );
    const isChecked = /[xX✓✔☑]|(?:^|\s)yes(?:\s|$)/i.test(nearby);
    if (isChecked) {
      tokens.push({
        type: 'checkbox',
        value: match[1].toLowerCase(),
        raw: match[0],
        position: match.index,
      });
    }
  }

  // Sort by position for proximity matching
  tokens.sort((a, b) => a.position - b.position);

  return tokens;
}
