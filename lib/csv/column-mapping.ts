export const EXPENSE_FIELD_TARGETS = [
  'date',
  'vendor',
  'amount',
  'category',
  'notes',
  'description',
  'entityType',
  'paymentMethod',
] as const;

export type ExpenseFieldTarget = (typeof EXPENSE_FIELD_TARGETS)[number];

export const MILEAGE_FIELD_TARGETS = [
  'date',
  'miles',
  'purpose',
  'destination',
  'notes',
  'isRoundTrip',
] as const;

export type MileageFieldTarget = (typeof MILEAGE_FIELD_TARGETS)[number];

export type ColumnMapping = {
  csvColumn: string;
  csvIndex: number;
  target: ExpenseFieldTarget | 'skip';
};

export type MileageColumnMapping = {
  csvColumn: string;
  csvIndex: number;
  target: MileageFieldTarget | 'skip';
};

const HEADER_ALIASES: Record<string, ExpenseFieldTarget> = {
  date: 'date',
  transaction_date: 'date',
  trans_date: 'date',
  'transaction date': 'date',
  posted_date: 'date',
  'posted date': 'date',

  vendor: 'vendor',
  payee: 'vendor',
  merchant: 'vendor',
  name: 'vendor',
  description: 'vendor',
  'merchant name': 'vendor',

  amount: 'amount',
  total: 'amount',
  cost: 'amount',
  price: 'amount',
  debit: 'amount',
  charge: 'amount',

  category: 'category',
  type: 'category',

  notes: 'notes',
  memo: 'notes',
  note: 'notes',
  comment: 'notes',

  entity_type: 'entityType',
  entity: 'entityType',
  'entity type': 'entityType',

  payment_method: 'paymentMethod',
  'payment method': 'paymentMethod',
  payment: 'paymentMethod',
};

export function autoDetectMappings(headers: string[]): ColumnMapping[] {
  const usedTargets = new Set<string>();

  return headers.map((header, index) => {
    const normalized = header.toLowerCase().trim().replace(/[_\- ]+/g, '_');
    // Also check with spaces for the alias map
    const withSpaces = header.toLowerCase().trim();

    let target: ExpenseFieldTarget | 'skip' = 'skip';

    // Try normalized underscore form, then space form, then original lowercase
    const match =
      HEADER_ALIASES[normalized] ??
      HEADER_ALIASES[withSpaces] ??
      HEADER_ALIASES[header.toLowerCase().trim()];

    if (match && !usedTargets.has(match)) {
      target = match;
      usedTargets.add(match);
    }

    return { csvColumn: header, csvIndex: index, target };
  });
}

const REQUIRED_TARGETS: ExpenseFieldTarget[] = ['date', 'vendor', 'amount'];

export type MappingValidationResult = {
  valid: boolean;
  missingRequired: ExpenseFieldTarget[];
};

export function validateMappings(
  mappings: ColumnMapping[]
): MappingValidationResult {
  const mappedTargets = new Set(
    mappings.map((m) => m.target).filter((t) => t !== 'skip')
  );

  const missingRequired = REQUIRED_TARGETS.filter(
    (t) => !mappedTargets.has(t)
  );

  return {
    valid: missingRequired.length === 0,
    missingRequired,
  };
}

// ─── Mileage Column Mapping ────────────────────────────────────

const MILEAGE_HEADER_ALIASES: Record<string, MileageFieldTarget> = {
  date: 'date',
  trip_date: 'date',
  'trip date': 'date',
  'travel date': 'date',

  miles: 'miles',
  distance: 'miles',
  mileage: 'miles',
  'total miles': 'miles',
  odometer: 'miles',

  purpose: 'purpose',
  reason: 'purpose',
  'trip purpose': 'purpose',
  'business purpose': 'purpose',

  destination: 'destination',
  location: 'destination',
  'to location': 'destination',
  to: 'destination',

  notes: 'notes',
  memo: 'notes',
  note: 'notes',
  comment: 'notes',

  round_trip: 'isRoundTrip',
  'round trip': 'isRoundTrip',
  roundtrip: 'isRoundTrip',
  'is round trip': 'isRoundTrip',
};

export function autoDetectMileageMappings(headers: string[]): MileageColumnMapping[] {
  const usedTargets = new Set<string>();

  return headers.map((header, index) => {
    const normalized = header.toLowerCase().trim().replace(/[_\- ]+/g, '_');
    const withSpaces = header.toLowerCase().trim();

    let target: MileageFieldTarget | 'skip' = 'skip';

    const match =
      MILEAGE_HEADER_ALIASES[normalized] ??
      MILEAGE_HEADER_ALIASES[withSpaces] ??
      MILEAGE_HEADER_ALIASES[header.toLowerCase().trim()];

    if (match && !usedTargets.has(match)) {
      target = match;
      usedTargets.add(match);
    }

    return { csvColumn: header, csvIndex: index, target };
  });
}

const REQUIRED_MILEAGE_TARGETS: MileageFieldTarget[] = ['date', 'miles'];

export type MileageMappingValidationResult = {
  valid: boolean;
  missingRequired: MileageFieldTarget[];
};

export function validateMileageMappings(
  mappings: MileageColumnMapping[]
): MileageMappingValidationResult {
  const mappedTargets = new Set(
    mappings.map((m) => m.target).filter((t) => t !== 'skip')
  );

  const missingRequired = REQUIRED_MILEAGE_TARGETS.filter(
    (t) => !mappedTargets.has(t)
  );

  return {
    valid: missingRequired.length === 0,
    missingRequired,
  };
}
