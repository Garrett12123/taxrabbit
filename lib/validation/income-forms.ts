import { z } from 'zod';

import { TAX_YEARS, INCOME_FORM_TYPES } from '@/lib/constants';

const moneyField = z.coerce.number().int().min(0).optional();
const requiredMoneyField = z.coerce.number().int().min(0, 'Required');

export const w2BoxesSchema = z.object({
  box1: requiredMoneyField,
  box2: requiredMoneyField,
  box3: moneyField,
  box4: moneyField,
  box5: moneyField,
  box6: moneyField,
  box7: moneyField, // Social security tips
  box8: moneyField, // Allocated tips
  box10: moneyField, // Dependent care benefits
  box11: moneyField, // Nonqualified plans
  // Box 13 checkboxes
  box13_statutory: z.boolean().optional(),
  box13_retirement: z.boolean().optional(),
  box13_sick_pay: z.boolean().optional(),
  // Box 12 codes
  box12a_code: z.string().max(2).optional(),
  box12a_amount: moneyField,
  box12b_code: z.string().max(2).optional(),
  box12b_amount: moneyField,
  box12c_code: z.string().max(2).optional(),
  box12c_amount: moneyField,
  box12d_code: z.string().max(2).optional(),
  box12d_amount: moneyField,
  box14_desc: z.string().max(100).optional(),
  box14_amount: moneyField,
  box15_state: z.string().max(2).optional(),
  box15_ein: z.string().max(20).optional(),
  box16: moneyField,
  box17: moneyField,
  box18: moneyField,
  box19: moneyField,
  box20: z.string().max(50).optional(),
});

export const necBoxesSchema = z.object({
  box1: requiredMoneyField,
  box4: moneyField,
  state_id: z.string().max(20).optional(),
  state_income: moneyField,
  state_tax: moneyField,
});

export const intBoxesSchema = z.object({
  box1: requiredMoneyField,
  box2: moneyField,
  box3: moneyField,
  box4: moneyField,
  state_id: z.string().max(20).optional(),
  state_income: moneyField,
  state_tax: moneyField,
});

export const divBoxesSchema = z.object({
  box1a: requiredMoneyField,
  box1b: moneyField,
  box2a: moneyField,
  box4: moneyField,
  state_id: z.string().max(20).optional(),
  state_income: moneyField,
  state_tax: moneyField,
});

export const miscBoxesSchema = z.object({
  box1: moneyField,
  box2: moneyField,
  box3: moneyField,
  box4: moneyField,
  box6: moneyField,
  box10: moneyField,
  state_id: z.string().max(20).optional(),
  state_income: moneyField,
  state_tax: moneyField,
});

export const kBoxesSchema = z.object({
  box1a: requiredMoneyField,
  box1b: moneyField,
  box2: z.string().max(10).optional(),
  box3: z.string().max(20).optional(),
  box4: moneyField,
  box5a: moneyField,
  box5b: moneyField,
  box5c: moneyField,
  box5d: moneyField,
  box5e: moneyField,
  box5f: moneyField,
  box5g: moneyField,
  box5h: moneyField,
  box5i: moneyField,
  box5j: moneyField,
  box5k: moneyField,
  box5l: moneyField,
  state_id: z.string().max(20).optional(),
  state_income: moneyField,
  state_tax: moneyField,
});

export const FORM_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  'W-2': w2BoxesSchema,
  '1099-NEC': necBoxesSchema,
  '1099-INT': intBoxesSchema,
  '1099-DIV': divBoxesSchema,
  '1099-MISC': miscBoxesSchema,
  '1099-K': kBoxesSchema,
};

export const incomeFormInputSchema = z.object({
  year: z.coerce
    .number()
    .refine(
      (val): val is (typeof TAX_YEARS)[number] =>
        (TAX_YEARS as readonly number[]).includes(val),
      'Invalid tax year'
    ),
  formType: z
    .string()
    .refine(
      (val): val is (typeof INCOME_FORM_TYPES)[number] =>
        (INCOME_FORM_TYPES as readonly string[]).includes(val),
      'Invalid form type'
    ),
  entityType: z.enum(['personal', 'business']).default('personal'),
  issuerName: z.string().min(1, 'Payer/employer name is required').max(200),
  issuerEin: z.string().max(20).optional(),
  // Address fields for payer/employer
  issuerAddress: z.string().max(200).optional(),
  issuerCity: z.string().max(100).optional(),
  issuerState: z.string().max(2).optional(),
  issuerZip: z.string().max(10).optional(),
  // Account/control numbers
  accountNumber: z.string().max(50).optional(),
  controlNumber: z.string().max(50).optional(),
  // When income was received (YYYY-MM-DD), optional
  incomeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  notes: z.string().max(1000).optional(),
  boxes: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
}).superRefine((data, ctx) => {
  // Validate boxes against the per-form schema if one exists
  const formSchema = FORM_SCHEMAS[data.formType];
  if (formSchema) {
    const result = formSchema.safeParse(data.boxes);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ['boxes', ...issue.path],
        });
      }
    }
  }
});

export type IncomeFormInput = z.infer<typeof incomeFormInputSchema>;
