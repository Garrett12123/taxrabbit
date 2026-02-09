import { CATEGORIES_REQUIRING_NOTES } from '@/lib/constants';

export type AuditFlag = {
  code: 'missing_receipt' | 'notes_recommended';
  message: string;
  severity: 'warning';
};

export function computeAuditFlags(expense: {
  category: string;
  receiptRef?: string;
  notes?: string;
  hasLinkedDocument?: boolean;
}): AuditFlag[] {
  const flags: AuditFlag[] = [];

  if (!expense.receiptRef && !expense.hasLinkedDocument) {
    flags.push({
      code: 'missing_receipt',
      message: 'No receipt attached. Consider adding one for recordkeeping.',
      severity: 'warning',
    });
  }

  if (
    (CATEGORIES_REQUIRING_NOTES as readonly string[]).includes(expense.category) &&
    !expense.notes?.trim()
  ) {
    flags.push({
      code: 'notes_recommended',
      message: `${expense.category} expenses benefit from notes describing the business purpose.`,
      severity: 'warning',
    });
  }

  return flags;
}

export function hasAuditWarnings(flags: AuditFlag[]): boolean {
  return flags.length > 0;
}
