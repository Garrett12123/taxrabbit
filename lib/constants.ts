import {
  LayoutDashboard,
  DollarSign,
  Building2,
  Receipt,
  FileText,
  Upload,
  BarChart3,
  Settings,
  Calendar,
  Car,
  ClipboardCheck,
  Zap,
} from 'lucide-react';

export const TAX_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;
export type TaxYear = (typeof TAX_YEARS)[number];

export const DEFAULT_TAX_YEAR: TaxYear = 2025;

export const EXPENSE_CATEGORIES = [
  'Advertising',
  'Car & Truck',
  'Commissions & Fees',
  'Contract Labor',
  'Depreciation',
  'Employee Benefits',
  'Insurance',
  'Interest (Mortgage)',
  'Interest (Other)',
  'Legal & Professional',
  'Office Expense',
  'Rent or Lease',
  'Repairs & Maintenance',
  'Supplies',
  'Taxes & Licenses',
  'Travel',
  'Meals',
  'Utilities',
  'Wages',
  'Other',
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'PayPal',
  'Venmo',
  'Other',
] as const;

export const CATEGORIES_REQUIRING_NOTES = ['Meals', 'Travel'] as const;

export const INCOME_FORM_TYPES = [
  'W-2',
  '1099-NEC',
  '1099-INT',
  '1099-DIV',
  '1099-MISC',
  '1099-K',
  'Other',
] as const;

export type IncomeFormType = (typeof INCOME_FORM_TYPES)[number];

export const UTILITY_TYPES = ['Water', 'Electric', 'Gas', 'Internet', 'Trash', 'Other'] as const;
export type UtilityType = (typeof UTILITY_TYPES)[number];

export const UTILITY_USAGE_UNITS: Record<UtilityType, string> = {
  Water: 'gallons',
  Electric: 'kWh',
  Gas: 'therms',
  Internet: 'Mbps',
  Trash: 'pickups',
  Other: '',
};

export const NAV_ITEMS = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Income', href: '/income', icon: DollarSign },
  { label: 'LLC', href: '/llc', icon: Building2 },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Imports', href: '/imports', icon: Upload },
  { label: 'Mileage', href: '/mileage', icon: Car },
  { label: 'Utilities', href: '/utilities', icon: Zap },
  { label: 'Quarterly', href: '/estimated-payments', icon: Calendar },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Checklist', href: '/checklist', icon: ClipboardCheck },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

// ─── Box Definitions ───────────────────────────────────────────

export type BoxDefinition = {
  key: string;
  label: string;
  type: 'money' | 'text' | 'checkbox';
  required?: boolean;
  section: 'federal' | 'state' | 'local' | 'other';
};

export const W2_BOX_DEFINITIONS: BoxDefinition[] = [
  { key: 'box1', label: 'Box 1 - Wages, tips, other comp', type: 'money', required: true, section: 'federal' },
  { key: 'box2', label: 'Box 2 - Federal income tax withheld', type: 'money', required: true, section: 'federal' },
  { key: 'box3', label: 'Box 3 - Social security wages', type: 'money', section: 'federal' },
  { key: 'box4', label: 'Box 4 - Social security tax withheld', type: 'money', section: 'federal' },
  { key: 'box5', label: 'Box 5 - Medicare wages and tips', type: 'money', section: 'federal' },
  { key: 'box6', label: 'Box 6 - Medicare tax withheld', type: 'money', section: 'federal' },
  { key: 'box7', label: 'Box 7 - Social security tips', type: 'money', section: 'federal' },
  { key: 'box8', label: 'Box 8 - Allocated tips', type: 'money', section: 'federal' },
  { key: 'box10', label: 'Box 10 - Dependent care benefits', type: 'money', section: 'federal' },
  { key: 'box11', label: 'Box 11 - Nonqualified plans', type: 'money', section: 'federal' },
  { key: 'box13_statutory', label: 'Box 13 - Statutory employee', type: 'checkbox', section: 'federal' },
  { key: 'box13_retirement', label: 'Box 13 - Retirement plan', type: 'checkbox', section: 'federal' },
  { key: 'box13_sick_pay', label: 'Box 13 - Third-party sick pay', type: 'checkbox', section: 'federal' },
  { key: 'box12a_code', label: 'Box 12a - Code', type: 'text', section: 'other' },
  { key: 'box12a_amount', label: 'Box 12a - Amount', type: 'money', section: 'other' },
  { key: 'box12b_code', label: 'Box 12b - Code', type: 'text', section: 'other' },
  { key: 'box12b_amount', label: 'Box 12b - Amount', type: 'money', section: 'other' },
  { key: 'box12c_code', label: 'Box 12c - Code', type: 'text', section: 'other' },
  { key: 'box12c_amount', label: 'Box 12c - Amount', type: 'money', section: 'other' },
  { key: 'box12d_code', label: 'Box 12d - Code', type: 'text', section: 'other' },
  { key: 'box12d_amount', label: 'Box 12d - Amount', type: 'money', section: 'other' },
  { key: 'box14_desc', label: 'Box 14 - Description', type: 'text', section: 'other' },
  { key: 'box14_amount', label: 'Box 14 - Amount', type: 'money', section: 'other' },
  { key: 'box15_state', label: 'Box 15 - State', type: 'text', section: 'state' },
  { key: 'box15_ein', label: 'Box 15 - Employer state ID', type: 'text', section: 'state' },
  { key: 'box16', label: 'Box 16 - State wages', type: 'money', section: 'state' },
  { key: 'box17', label: 'Box 17 - State income tax', type: 'money', section: 'state' },
  { key: 'box18', label: 'Box 18 - Local wages', type: 'money', section: 'local' },
  { key: 'box19', label: 'Box 19 - Local income tax', type: 'money', section: 'local' },
  { key: 'box20', label: 'Box 20 - Locality name', type: 'text', section: 'local' },
];

export const NEC_1099_BOX_DEFINITIONS: BoxDefinition[] = [
  { key: 'box1', label: 'Box 1 - Nonemployee compensation', type: 'money', required: true, section: 'federal' },
  { key: 'box4', label: 'Box 4 - Federal income tax withheld', type: 'money', section: 'federal' },
  { key: 'state_id', label: 'State/Payer state no.', type: 'text', section: 'state' },
  { key: 'state_income', label: 'State income', type: 'money', section: 'state' },
  { key: 'state_tax', label: 'State tax withheld', type: 'money', section: 'state' },
];

export const INT_1099_BOX_DEFINITIONS: BoxDefinition[] = [
  { key: 'box1', label: 'Box 1 - Interest income', type: 'money', required: true, section: 'federal' },
  { key: 'box2', label: 'Box 2 - Early withdrawal penalty', type: 'money', section: 'federal' },
  { key: 'box3', label: 'Box 3 - Interest on U.S. savings bonds', type: 'money', section: 'federal' },
  { key: 'box4', label: 'Box 4 - Federal income tax withheld', type: 'money', section: 'federal' },
  { key: 'state_id', label: 'Box 13 - State/Payer state no.', type: 'text', section: 'state' },
  { key: 'state_income', label: 'Box 14 - State income', type: 'money', section: 'state' },
  { key: 'state_tax', label: 'Box 15 - State tax withheld', type: 'money', section: 'state' },
];

export const DIV_1099_BOX_DEFINITIONS: BoxDefinition[] = [
  { key: 'box1a', label: 'Box 1a - Total ordinary dividends', type: 'money', required: true, section: 'federal' },
  { key: 'box1b', label: 'Box 1b - Qualified dividends', type: 'money', section: 'federal' },
  { key: 'box2a', label: 'Box 2a - Total capital gain distr.', type: 'money', section: 'federal' },
  { key: 'box4', label: 'Box 4 - Federal income tax withheld', type: 'money', section: 'federal' },
  { key: 'state_id', label: 'Box 12 - State/Payer state no.', type: 'text', section: 'state' },
  { key: 'state_income', label: 'Box 13 - State income', type: 'money', section: 'state' },
  { key: 'state_tax', label: 'Box 14 - State tax withheld', type: 'money', section: 'state' },
];

export const MISC_1099_BOX_DEFINITIONS: BoxDefinition[] = [
  { key: 'box1', label: 'Box 1 - Rents', type: 'money', section: 'federal' },
  { key: 'box2', label: 'Box 2 - Royalties', type: 'money', section: 'federal' },
  { key: 'box3', label: 'Box 3 - Other income', type: 'money', section: 'federal' },
  { key: 'box4', label: 'Box 4 - Federal income tax withheld', type: 'money', section: 'federal' },
  { key: 'box6', label: 'Box 6 - Medical and health care payments', type: 'money', section: 'federal' },
  { key: 'box10', label: 'Box 10 - Gross proceeds paid to attorney', type: 'money', section: 'federal' },
  { key: 'state_id', label: 'State/Payer state no.', type: 'text', section: 'state' },
  { key: 'state_income', label: 'State income', type: 'money', section: 'state' },
  { key: 'state_tax', label: 'State tax withheld', type: 'money', section: 'state' },
];

// 1099-K: Payment Card and Third-Party Network Transactions (PayPal, Venmo, marketplaces)
export const K_1099_BOX_DEFINITIONS: BoxDefinition[] = [
  { key: 'box1a', label: 'Box 1a - Gross amount of payment card/third party transactions', type: 'money', required: true, section: 'federal' },
  { key: 'box1b', label: 'Box 1b - Card not present transactions', type: 'money', section: 'federal' },
  { key: 'box2', label: 'Box 2 - Merchant category code', type: 'text', section: 'federal' },
  { key: 'box3', label: 'Box 3 - Number of payment transactions', type: 'text', section: 'federal' },
  { key: 'box4', label: 'Box 4 - Federal income tax withheld', type: 'money', section: 'federal' },
  { key: 'box5a', label: 'Box 5a - January', type: 'money', section: 'other' },
  { key: 'box5b', label: 'Box 5b - February', type: 'money', section: 'other' },
  { key: 'box5c', label: 'Box 5c - March', type: 'money', section: 'other' },
  { key: 'box5d', label: 'Box 5d - April', type: 'money', section: 'other' },
  { key: 'box5e', label: 'Box 5e - May', type: 'money', section: 'other' },
  { key: 'box5f', label: 'Box 5f - June', type: 'money', section: 'other' },
  { key: 'box5g', label: 'Box 5g - July', type: 'money', section: 'other' },
  { key: 'box5h', label: 'Box 5h - August', type: 'money', section: 'other' },
  { key: 'box5i', label: 'Box 5i - September', type: 'money', section: 'other' },
  { key: 'box5j', label: 'Box 5j - October', type: 'money', section: 'other' },
  { key: 'box5k', label: 'Box 5k - November', type: 'money', section: 'other' },
  { key: 'box5l', label: 'Box 5l - December', type: 'money', section: 'other' },
  { key: 'state_id', label: 'State/Payer state no.', type: 'text', section: 'state' },
  { key: 'state_income', label: 'State income', type: 'money', section: 'state' },
  { key: 'state_tax', label: 'State tax withheld', type: 'money', section: 'state' },
];

export const OTHER_BOX_DEFINITIONS: BoxDefinition[] = [
  { key: 'box1', label: 'Gross income', type: 'money', required: true, section: 'federal' },
  { key: 'description', label: 'Income description/source', type: 'text', section: 'other' },
  { key: 'box4', label: 'Federal tax withheld', type: 'money', section: 'federal' },
];

export const FORM_BOX_DEFINITIONS: Record<IncomeFormType, BoxDefinition[]> = {
  'W-2': W2_BOX_DEFINITIONS,
  '1099-NEC': NEC_1099_BOX_DEFINITIONS,
  '1099-INT': INT_1099_BOX_DEFINITIONS,
  '1099-DIV': DIV_1099_BOX_DEFINITIONS,
  '1099-MISC': MISC_1099_BOX_DEFINITIONS,
  '1099-K': K_1099_BOX_DEFINITIONS,
  'Other': OTHER_BOX_DEFINITIONS,
};

export const W2_BOX12_CODES = [
  { code: 'A', description: 'Uncollected social security or RRTA tax on tips' },
  { code: 'B', description: 'Uncollected Medicare tax on tips' },
  { code: 'C', description: 'Taxable cost of group-term life insurance over $50,000' },
  { code: 'D', description: '401(k) elective deferrals' },
  { code: 'E', description: '403(b) elective deferrals' },
  { code: 'F', description: '408(k)(6) SEP elective deferrals' },
  { code: 'G', description: '457(b) elective deferrals' },
  { code: 'H', description: '501(c)(18)(D) elective deferrals' },
  { code: 'J', description: 'Nontaxable sick pay' },
  { code: 'K', description: '20% excise tax on excess golden parachute payments' },
  { code: 'L', description: 'Substantiated employee business expense reimbursements' },
  { code: 'M', description: 'Uncollected social security or RRTA tax on group-term life insurance' },
  { code: 'N', description: 'Uncollected Medicare tax on group-term life insurance' },
  { code: 'P', description: 'Excludable moving expense reimbursements' },
  { code: 'Q', description: 'Nontaxable combat pay' },
  { code: 'R', description: 'Employer contributions to Archer MSA' },
  { code: 'S', description: 'SIMPLE 408(p) salary reduction' },
  { code: 'T', description: 'Adoption benefits' },
  { code: 'V', description: 'Income from exercise of nonstatutory stock options' },
  { code: 'W', description: 'Employer contributions to Health Savings Account' },
  { code: 'Y', description: 'Deferrals under section 409A nonqualified deferred comp plan' },
  { code: 'Z', description: 'Income under section 409A nonqualified deferred comp plan' },
  { code: 'AA', description: 'Roth 401(k) contributions' },
  { code: 'BB', description: 'Roth 403(b) contributions' },
  { code: 'DD', description: 'Cost of employer-sponsored health coverage' },
  { code: 'EE', description: 'Roth 457(b) contributions' },
  { code: 'FF', description: 'Permitted benefits under qualified small employer HRA' },
  { code: 'GG', description: 'Income from qualified equity grants under section 83(i)' },
  { code: 'HH', description: 'Aggregate deferrals under section 83(i) elections' },
] as const;
