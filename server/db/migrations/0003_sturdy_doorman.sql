PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_business_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_business_profiles`("id", "year", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "payload_encrypted", "created_at", "updated_at" FROM `business_profiles`;--> statement-breakpoint
DROP TABLE `business_profiles`;--> statement-breakpoint
ALTER TABLE `__new_business_profiles` RENAME TO `business_profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_business_profiles_year` ON `business_profiles` (`year`);--> statement-breakpoint
CREATE TABLE `__new_checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`payload_encrypted` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_checklist_items`("id", "year", "title", "completed", "sort_order", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "title", "completed", "sort_order", "payload_encrypted", "created_at", "updated_at" FROM `checklist_items`;--> statement-breakpoint
DROP TABLE `checklist_items`;--> statement-breakpoint
ALTER TABLE `__new_checklist_items` RENAME TO `checklist_items`;--> statement-breakpoint
CREATE INDEX `idx_checklist_year` ON `checklist_items` (`year`);--> statement-breakpoint
CREATE TABLE `__new_custom_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_custom_categories`("id", "year", "name", "created_at") SELECT "id", "year", "name", "created_at" FROM `custom_categories`;--> statement-breakpoint
DROP TABLE `custom_categories`;--> statement-breakpoint
ALTER TABLE `__new_custom_categories` RENAME TO `custom_categories`;--> statement-breakpoint
CREATE INDEX `idx_custom_categories_year` ON `custom_categories` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_custom_categories_year_name` ON `custom_categories` (`year`,`name`);--> statement-breakpoint
CREATE TABLE `__new_document_files` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`storage_path` text NOT NULL,
	`linked_entity_type` text,
	`linked_entity_id` text,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_document_files`("id", "year", "mime_type", "size_bytes", "storage_path", "linked_entity_type", "linked_entity_id", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "mime_type", "size_bytes", "storage_path", "linked_entity_type", "linked_entity_id", "payload_encrypted", "created_at", "updated_at" FROM `document_files`;--> statement-breakpoint
DROP TABLE `document_files`;--> statement-breakpoint
ALTER TABLE `__new_document_files` RENAME TO `document_files`;--> statement-breakpoint
CREATE INDEX `idx_docs_year` ON `document_files` (`year`);--> statement-breakpoint
CREATE INDEX `idx_docs_linked` ON `document_files` (`linked_entity_type`,`linked_entity_id`);--> statement-breakpoint
CREATE TABLE `__new_estimated_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`quarter` integer NOT NULL,
	`due_date` text NOT NULL,
	`amount_due` integer DEFAULT 0 NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`date_paid` text,
	`payload_encrypted` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_estimated_payments`("id", "year", "quarter", "due_date", "amount_due", "amount_paid", "date_paid", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "quarter", "due_date", "amount_due", "amount_paid", "date_paid", "payload_encrypted", "created_at", "updated_at" FROM `estimated_payments`;--> statement-breakpoint
DROP TABLE `estimated_payments`;--> statement-breakpoint
ALTER TABLE `__new_estimated_payments` RENAME TO `estimated_payments`;--> statement-breakpoint
CREATE INDEX `idx_est_payments_year` ON `estimated_payments` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_est_payments_year_quarter` ON `estimated_payments` (`year`,`quarter`);--> statement-breakpoint
CREATE TABLE `__new_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`category` text NOT NULL,
	`entity_type` text DEFAULT 'personal' NOT NULL,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_expenses`("id", "year", "date", "amount", "category", "entity_type", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "date", "amount", "category", "entity_type", "payload_encrypted", "created_at", "updated_at" FROM `expenses`;--> statement-breakpoint
DROP TABLE `expenses`;--> statement-breakpoint
ALTER TABLE `__new_expenses` RENAME TO `expenses`;--> statement-breakpoint
CREATE INDEX `idx_expenses_year` ON `expenses` (`year`);--> statement-breakpoint
CREATE INDEX `idx_expenses_year_date` ON `expenses` (`year`,`date`);--> statement-breakpoint
CREATE INDEX `idx_expenses_year_category` ON `expenses` (`year`,`category`);--> statement-breakpoint
CREATE INDEX `idx_expenses_year_entity` ON `expenses` (`year`,`entity_type`);--> statement-breakpoint
CREATE TABLE `__new_income_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`form_type` text NOT NULL,
	`entity_type` text DEFAULT 'personal' NOT NULL,
	`amount` integer NOT NULL,
	`fed_withholding` integer DEFAULT 0 NOT NULL,
	`state_withholding` integer DEFAULT 0 NOT NULL,
	`income_date` text,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_income_documents`("id", "year", "form_type", "entity_type", "amount", "fed_withholding", "state_withholding", "income_date", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "form_type", "entity_type", "amount", "fed_withholding", "state_withholding", "income_date", "payload_encrypted", "created_at", "updated_at" FROM `income_documents`;--> statement-breakpoint
DROP TABLE `income_documents`;--> statement-breakpoint
ALTER TABLE `__new_income_documents` RENAME TO `income_documents`;--> statement-breakpoint
CREATE INDEX `idx_income_year` ON `income_documents` (`year`);--> statement-breakpoint
CREATE INDEX `idx_income_year_form` ON `income_documents` (`year`,`form_type`);--> statement-breakpoint
CREATE TABLE `__new_mileage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`date` text NOT NULL,
	`miles` integer NOT NULL,
	`payload_encrypted` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_mileage_logs`("id", "year", "date", "miles", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "date", "miles", "payload_encrypted", "created_at", "updated_at" FROM `mileage_logs`;--> statement-breakpoint
DROP TABLE `mileage_logs`;--> statement-breakpoint
ALTER TABLE `__new_mileage_logs` RENAME TO `mileage_logs`;--> statement-breakpoint
CREATE INDEX `idx_mileage_year` ON `mileage_logs` (`year`);--> statement-breakpoint
CREATE INDEX `idx_mileage_year_date` ON `mileage_logs` (`year`,`date`);--> statement-breakpoint
CREATE TABLE `__new_person_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`label` text NOT NULL,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_person_profiles`("id", "year", "label", "payload_encrypted", "created_at", "updated_at") SELECT "id", "year", "label", "payload_encrypted", "created_at", "updated_at" FROM `person_profiles`;--> statement-breakpoint
DROP TABLE `person_profiles`;--> statement-breakpoint
ALTER TABLE `__new_person_profiles` RENAME TO `person_profiles`;--> statement-breakpoint
CREATE INDEX `idx_person_profiles_year` ON `person_profiles` (`year`);