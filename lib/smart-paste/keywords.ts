import type { IncomeFormType } from '@/lib/constants';

/**
 * Keywords for each box, used to match nearby text tokens to form fields.
 * Each key maps to an array of keywords/phrases that appear near the value
 * on the physical form or in PDF text.
 */
export const FORM_KEYWORDS: Record<IncomeFormType, Record<string, string[]>> = {
  'W-2': {
    box1: ['wages', 'tips', 'other comp', 'compensation', 'box 1', 'wages tips other compensation'],
    box2: ['federal income tax withheld', 'federal tax withheld', 'fit withheld', 'box 2'],
    box3: ['social security wages', 'ss wages', 'soc sec wages', 'box 3'],
    box4: ['social security tax withheld', 'ss tax withheld', 'soc sec tax', 'box 4'],
    box5: ['medicare wages', 'medicare wages and tips', 'box 5'],
    box6: ['medicare tax withheld', 'medicare tax', 'box 6'],
    box7: ['social security tips', 'ss tips', 'box 7'],
    box8: ['allocated tips', 'box 8'],
    box10: ['dependent care benefits', 'dependent care', 'box 10'],
    box11: ['nonqualified plans', 'nonqualified', 'box 11'],
    box12a_amount: ['box 12a', '12a amount', '12a'],
    box12b_amount: ['box 12b', '12b amount', '12b'],
    box12c_amount: ['box 12c', '12c amount', '12c'],
    box12d_amount: ['box 12d', '12d amount', '12d'],
    box14_amount: ['box 14', 'other'],
    box16: ['state wages', 'state wages tips', 'box 16'],
    box17: ['state income tax', 'state tax', 'box 17'],
    box18: ['local wages', 'local wages tips', 'box 18'],
    box19: ['local income tax', 'local tax', 'box 19'],
  },
  '1099-NEC': {
    box1: ['nonemployee compensation', 'nec', 'compensation', 'box 1'],
    box4: ['federal income tax withheld', 'federal tax withheld', 'box 4'],
    state_income: ['state income', 'state income box'],
    state_tax: ['state tax withheld', 'state tax'],
  },
  '1099-INT': {
    box1: ['interest income', 'interest', 'box 1'],
    box2: ['early withdrawal penalty', 'early withdrawal', 'box 2'],
    box3: ['interest on u.s. savings bonds', 'savings bonds', 'box 3'],
    box4: ['federal income tax withheld', 'federal tax withheld', 'box 4'],
    state_income: ['state income', 'state income box'],
    state_tax: ['state tax withheld', 'state tax'],
  },
  '1099-DIV': {
    box1a: ['total ordinary dividends', 'ordinary dividends', 'box 1a'],
    box1b: ['qualified dividends', 'box 1b'],
    box2a: ['total capital gain', 'capital gain dist', 'box 2a'],
    box4: ['federal income tax withheld', 'federal tax withheld', 'box 4'],
    state_income: ['state income', 'state income box'],
    state_tax: ['state tax withheld', 'state tax'],
  },
  '1099-MISC': {
    box1: ['rents', 'box 1'],
    box2: ['royalties', 'box 2'],
    box3: ['other income', 'box 3'],
    box4: ['federal income tax withheld', 'federal tax withheld', 'box 4'],
    box6: ['medical and health care', 'medical', 'health care payments', 'box 6'],
    box10: ['gross proceeds', 'proceeds paid to attorney', 'attorney', 'box 10'],
    state_income: ['state income', 'state income box'],
    state_tax: ['state tax withheld', 'state tax'],
  },
  '1099-K': {
    box1a: ['gross amount', 'payment card', 'third party', 'box 1a'],
    box1b: ['card not present', 'box 1b'],
    box4: ['federal income tax withheld', 'federal tax withheld', 'box 4'],
    box5a: ['january', 'jan', 'box 5a'],
    box5b: ['february', 'feb', 'box 5b'],
    box5c: ['march', 'mar', 'box 5c'],
    box5d: ['april', 'apr', 'box 5d'],
    box5e: ['may', 'box 5e'],
    box5f: ['june', 'jun', 'box 5f'],
    box5g: ['july', 'jul', 'box 5g'],
    box5h: ['august', 'aug', 'box 5h'],
    box5i: ['september', 'sep', 'box 5i'],
    box5j: ['october', 'oct', 'box 5j'],
    box5k: ['november', 'nov', 'box 5k'],
    box5l: ['december', 'dec', 'box 5l'],
    state_income: ['state income', 'state income box'],
    state_tax: ['state tax withheld', 'state tax'],
  },
};

/** Keywords for issuer/employer/payer identification */
export const ISSUER_KEYWORDS = {
  name: ['employer', 'payer', 'filer', 'company name', "employer's name", "payer's name"],
  ein: ['employer identification', 'ein', "payer's tin", "payer's federal", "employer's id"],
  address: ['employer address', 'payer address', "employer's address", "payer's address"],
};
