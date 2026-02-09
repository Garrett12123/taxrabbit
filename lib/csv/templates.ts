export const EXPENSE_CSV_COLUMNS = [
  'date',
  'vendor',
  'amount',
  'category',
  'entity_type',
  'description',
  'notes',
  'payment_method',
] as const;

export const W2_CSV_COLUMNS = [
  'employer_name',
  'employer_ein',
  'box1_wages',
  'box2_fed_withheld',
  'box3_ss_wages',
  'box4_ss_withheld',
  'box5_medicare_wages',
  'box6_medicare_withheld',
] as const;

export const INCOME_CSV_COLUMNS = [
  'form_type',
  'entity_type',
  'issuer_name',
  'issuer_ein',
  'amount',
  'fed_withholding',
  'notes',
] as const;

export function generateTemplateCSV(columns: readonly string[]): string {
  return columns.join(',') + '\n';
}
