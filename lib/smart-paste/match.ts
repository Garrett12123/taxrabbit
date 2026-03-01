import { FORM_BOX_DEFINITIONS, type IncomeFormType } from '@/lib/constants';
import { FORM_KEYWORDS, ISSUER_KEYWORDS } from './keywords';
import type { Token, MatchResult, Confidence, SmartPasteResult } from './types';

const PROXIMITY_WINDOW = 150; // characters to search for keyword matches

type ScoredMatch = {
  key: string;
  tokenIndex: number;
  score: number;
  confidence: Confidence;
};

/**
 * Check if two positions are on the same line in the text.
 */
function onSameLine(text: string, pos1: number, pos2: number): boolean {
  const start = Math.min(pos1, pos2);
  const end = Math.max(pos1, pos2);
  return !text.slice(start, end).includes('\n');
}

/**
 * Score a token against keywords using absolute positions in the original text.
 * Gives a large bonus when keyword and token appear on the same line.
 */
function scoreTokenForBox(
  lowerText: string,
  tokenPosition: number,
  keywords: string[]
): { score: number; confidence: Confidence } {
  let bestScore = 0;

  for (const keyword of keywords) {
    const lowerKw = keyword.toLowerCase();
    let searchFrom = Math.max(0, tokenPosition - PROXIMITY_WINDOW);
    const searchEnd = tokenPosition + PROXIMITY_WINDOW;

    while (searchFrom < searchEnd) {
      const idx = lowerText.indexOf(lowerKw, searchFrom);
      if (idx === -1 || idx > searchEnd) break;
      searchFrom = idx + 1;

      const distance = Math.abs(idx - tokenPosition);

      // Box references ("box 1", "box 2a") get highest base score
      const isBoxRef = /^box \d/.test(keyword);
      const baseScore = isBoxRef ? 100 : 80;

      // Same-line bonus: keywords on the same line as the value are strong matches
      const sameLine = onSameLine(lowerText, idx, tokenPosition);
      const sameLineBonus = sameLine ? 50 : 0;

      // Closer = higher bonus (0-30 points)
      const proximityBonus = Math.max(0, 30 - distance / 4);

      // Longer keywords are more specific (0-20 points)
      const lengthBonus = Math.min(keyword.length * 2, 20);

      bestScore = Math.max(
        bestScore,
        baseScore + sameLineBonus + proximityBonus + lengthBonus
      );
    }
  }

  let confidence: Confidence = 'low';
  if (bestScore >= 140) confidence = 'high';
  else if (bestScore >= 100) confidence = 'medium';

  return { score: bestScore, confidence };
}

/**
 * Match extracted tokens to form box fields.
 */
export function matchTokensToBoxes(
  tokens: Token[],
  formType: IncomeFormType,
  rawText: string
): SmartPasteResult {
  const keywords = FORM_KEYWORDS[formType];
  const boxDefs = FORM_BOX_DEFINITIONS[formType];
  const lowerText = rawText.toLowerCase();

  const matches: MatchResult[] = [];
  const boxes: Record<string, number | string | boolean> = {};
  const usedTokens = new Set<number>();
  const assignedBoxes = new Set<string>();

  // Collect all possible scored matches for money tokens
  const scoredMatches: ScoredMatch[] = [];

  const moneyTokens = tokens.filter((t) => t.type === 'money');
  for (let i = 0; i < moneyTokens.length; i++) {
    const token = moneyTokens[i];

    for (const [boxKey, boxKeywords] of Object.entries(keywords)) {
      // Only match money tokens to money-type boxes
      const def = boxDefs.find((d) => d.key === boxKey);
      if (!def || def.type !== 'money') continue;

      const { score, confidence } = scoreTokenForBox(
        lowerText,
        token.position,
        boxKeywords
      );
      if (score > 0) {
        scoredMatches.push({
          key: boxKey,
          tokenIndex: i,
          score,
          confidence,
        });
      }
    }
  }

  // Greedy assignment: highest score first, each box and token used at most once
  scoredMatches.sort((a, b) => b.score - a.score);

  for (const sm of scoredMatches) {
    if (assignedBoxes.has(sm.key) || usedTokens.has(sm.tokenIndex)) continue;

    const token = moneyTokens[sm.tokenIndex];
    const def = boxDefs.find((d) => d.key === sm.key)!;

    assignedBoxes.add(sm.key);
    usedTokens.add(sm.tokenIndex);

    const value = token.value as number;
    boxes[sm.key] = value;
    matches.push({
      key: sm.key,
      label: def.label,
      value,
      confidence: sm.confidence,
    });
  }

  // Handle checkbox tokens (W-2 only)
  if (formType === 'W-2') {
    for (const token of tokens) {
      if (token.type !== 'checkbox') continue;
      const val = (token.value as string).toLowerCase();
      if (val.includes('statutory')) {
        boxes.box13_statutory = true;
        matches.push({
          key: 'box13_statutory',
          label: 'Box 13 - Statutory employee',
          value: true,
          confidence: 'high',
        });
      } else if (val.includes('retirement')) {
        boxes.box13_retirement = true;
        matches.push({
          key: 'box13_retirement',
          label: 'Box 13 - Retirement plan',
          value: true,
          confidence: 'high',
        });
      } else if (val.includes('sick')) {
        boxes.box13_sick_pay = true;
        matches.push({
          key: 'box13_sick_pay',
          label: 'Box 13 - Third-party sick pay',
          value: true,
          confidence: 'high',
        });
      }
    }
  }

  // Extract state code for state-related boxes
  const stateTokens = tokens.filter((t) => t.type === 'state');
  if (stateTokens.length > 0) {
    const stateCode = stateTokens[0].value as string;
    const stateBoxKey = formType === 'W-2' ? 'box15_state' : null;
    if (stateBoxKey && !assignedBoxes.has(stateBoxKey)) {
      boxes[stateBoxKey] = stateCode;
      const def = boxDefs.find((d) => d.key === stateBoxKey);
      if (def) {
        matches.push({
          key: stateBoxKey,
          label: def.label,
          value: stateCode,
          confidence: 'medium',
        });
      }
    }
  }

  // Extract issuer info
  const result: SmartPasteResult = {
    matches,
    boxes,
    unmatched: [],
  };

  // Find EIN
  const einTokens = tokens.filter((t) => t.type === 'ein');
  if (einTokens.length > 0) {
    for (const einToken of einTokens) {
      const start = Math.max(0, einToken.position - PROXIMITY_WINDOW);
      const nearbyText = lowerText.slice(start, einToken.position + PROXIMITY_WINDOW);
      const isIssuerEin = ISSUER_KEYWORDS.ein.some((kw) =>
        nearbyText.includes(kw.toLowerCase())
      );
      if (isIssuerEin || einTokens.length === 1) {
        result.issuerEin = (einToken.value as string).replace('-', '');
        break;
      }
    }
    if (!result.issuerEin) {
      result.issuerEin = (einTokens[0].value as string).replace('-', '');
    }
  }

  // Extract issuer name
  // Sort keywords longest first so more specific ones match first
  const sortedNameKws = [...ISSUER_KEYWORDS.name].sort(
    (a, b) => b.length - a.length
  );
  for (const nameKw of sortedNameKws) {
    const kwIdx = lowerText.indexOf(nameKw);
    if (kwIdx === -1) continue;

    const afterKw = rawText.slice(
      kwIdx + nameKw.length,
      kwIdx + nameKw.length + 200
    );

    // Pattern 1: "label: Value" (value after colon on same line)
    const colonMatch = afterKw.match(/^:\s*([A-Za-z][^\n]{2,})/);
    if (colonMatch) {
      result.issuerName = colonMatch[1].trim();
      break;
    }

    // Pattern 2: value on the next line (label continues with ", address..." etc.)
    const nextLineMatch = afterKw.match(/[^\n]*\n\s*([A-Za-z][^\n]{2,})/);
    if (nextLineMatch) {
      result.issuerName = nextLineMatch[1].trim();
      break;
    }
  }

  // Extract issuer state from state tokens
  if (stateTokens.length > 0) {
    result.issuerState = stateTokens[0].value as string;
  }

  // Collect unmatched money tokens
  for (let i = 0; i < moneyTokens.length; i++) {
    if (!usedTokens.has(i)) {
      result.unmatched.push(moneyTokens[i]);
    }
  }

  return result;
}
