import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ─── tax_years ──────────────────────────────────────────────────

export const taxYears = sqliteTable('tax_years', {
  year: integer('year').primaryKey(),
  status: text('status', { enum: ['open', 'in_progress', 'filed', 'amended'] })
    .notNull()
    .default('open'),
  filingStatus: text('filing_status', { enum: ['single', 'mfj', 'mfs', 'hoh'] })
    .notNull()
    .default('single'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ─── person_profiles ────────────────────────────────────────────

export const personProfiles = sqliteTable(
  'person_profiles',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    payloadEncrypted: text('payload_encrypted').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_person_profiles_year').on(table.year)]
);

// ─── business_profiles ──────────────────────────────────────────

export const businessProfiles = sqliteTable(
  'business_profiles',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    payloadEncrypted: text('payload_encrypted').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_business_profiles_year').on(table.year)]
);

// ─── income_documents ───────────────────────────────────────────

export const incomeDocuments = sqliteTable(
  'income_documents',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    formType: text('form_type').notNull(),
    entityType: text('entity_type', { enum: ['personal', 'business'] })
      .notNull()
      .default('personal'),
    amount: integer('amount').notNull(),
    fedWithholding: integer('fed_withholding').notNull().default(0),
    stateWithholding: integer('state_withholding').notNull().default(0),
    incomeDate: text('income_date'), // Optional: when income was received (vs. when entered)
    payloadEncrypted: text('payload_encrypted').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_income_year').on(table.year),
    index('idx_income_year_form').on(table.year, table.formType),
  ]
);

// ─── expenses ───────────────────────────────────────────────────

export const expenses = sqliteTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    amount: integer('amount').notNull(),
    category: text('category').notNull(),
    entityType: text('entity_type', { enum: ['personal', 'business'] })
      .notNull()
      .default('personal'),
    payloadEncrypted: text('payload_encrypted').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_expenses_year').on(table.year),
    index('idx_expenses_year_date').on(table.year, table.date),
    index('idx_expenses_year_category').on(table.year, table.category),
    index('idx_expenses_year_entity').on(table.year, table.entityType),
  ]
);

// ─── document_files ─────────────────────────────────────────────

export const documentFiles = sqliteTable(
  'document_files',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    storagePath: text('storage_path').notNull(),
    linkedEntityType: text('linked_entity_type'),
    linkedEntityId: text('linked_entity_id'),
    payloadEncrypted: text('payload_encrypted').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_docs_year').on(table.year),
    index('idx_docs_linked').on(table.linkedEntityType, table.linkedEntityId),
  ]
);

// ─── custom_categories ─────────────────────────────────────────

export const customCategories = sqliteTable(
  'custom_categories',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_custom_categories_year').on(table.year),
    uniqueIndex('idx_custom_categories_year_name').on(table.year, table.name),
  ]
);

// ─── estimated_payments ────────────────────────────────────────

export const estimatedPayments = sqliteTable(
  'estimated_payments',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    quarter: integer('quarter').notNull(), // 1-4
    dueDate: text('due_date').notNull(),
    amountDue: integer('amount_due').notNull().default(0),
    amountPaid: integer('amount_paid').notNull().default(0),
    datePaid: text('date_paid'),
    payloadEncrypted: text('payload_encrypted'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_est_payments_year').on(table.year),
    uniqueIndex('idx_est_payments_year_quarter').on(table.year, table.quarter),
  ]
);

// ─── mileage_logs ──────────────────────────────────────────────

export const mileageLogs = sqliteTable(
  'mileage_logs',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    miles: integer('miles').notNull(), // stored as miles * 100 for precision
    payloadEncrypted: text('payload_encrypted'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_mileage_year').on(table.year),
    index('idx_mileage_year_date').on(table.year, table.date),
  ]
);

// ─── utility_bills ─────────────────────────────────────────────

export const utilityBills = sqliteTable(
  'utility_bills',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    utilityType: text('utility_type').notNull(),
    billDate: text('bill_date').notNull(),
    amount: integer('amount').notNull(), // cents
    payloadEncrypted: text('payload_encrypted').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_utility_bills_year').on(table.year),
    index('idx_utility_bills_year_type').on(table.year, table.utilityType),
    index('idx_utility_bills_year_date').on(table.year, table.billDate),
  ]
);

// ─── checklist_items ────────────────────────────────────────────

export const checklistItems = sqliteTable(
  'checklist_items',
  {
    id: text('id').primaryKey(),
    year: integer('year')
      .notNull()
      .references(() => taxYears.year, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    completed: integer('completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    payloadEncrypted: text('payload_encrypted'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_checklist_year').on(table.year)]
);
