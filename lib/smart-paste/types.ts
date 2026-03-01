export type TokenType = 'money' | 'ein' | 'state' | 'text' | 'checkbox';

export type Token = {
  type: TokenType;
  value: string | number;
  raw: string;
  position: number;
};

export type Confidence = 'high' | 'medium' | 'low';

export type MatchResult = {
  key: string;
  label: string;
  value: number | string | boolean;
  confidence: Confidence;
};

export type SmartPasteResult = {
  matches: MatchResult[];
  boxes: Record<string, number | string | boolean>;
  issuerName?: string;
  issuerEin?: string;
  issuerAddress?: string;
  issuerCity?: string;
  issuerState?: string;
  issuerZip?: string;
  unmatched: Token[];
};
