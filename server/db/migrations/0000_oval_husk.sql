CREATE TABLE `business_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_business_profiles_year` ON `business_profiles` (`year`);--> statement-breakpoint
CREATE TABLE `checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`payload_encrypted` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_checklist_year` ON `checklist_items` (`year`);--> statement-breakpoint
CREATE TABLE `custom_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_custom_categories_year` ON `custom_categories` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_custom_categories_year_name` ON `custom_categories` (`year`,`name`);--> statement-breakpoint
CREATE TABLE `document_files` (
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
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_docs_year` ON `document_files` (`year`);--> statement-breakpoint
CREATE INDEX `idx_docs_linked` ON `document_files` (`linked_entity_type`,`linked_entity_id`);--> statement-breakpoint
CREATE TABLE `estimated_payments` (
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
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_est_payments_year` ON `estimated_payments` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_est_payments_year_quarter` ON `estimated_payments` (`year`,`quarter`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`category` text NOT NULL,
	`entity_type` text DEFAULT 'personal' NOT NULL,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_expenses_year` ON `expenses` (`year`);--> statement-breakpoint
CREATE INDEX `idx_expenses_year_date` ON `expenses` (`year`,`date`);--> statement-breakpoint
CREATE INDEX `idx_expenses_year_category` ON `expenses` (`year`,`category`);--> statement-breakpoint
CREATE INDEX `idx_expenses_year_entity` ON `expenses` (`year`,`entity_type`);--> statement-breakpoint
CREATE TABLE `income_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`form_type` text NOT NULL,
	`entity_type` text DEFAULT 'personal' NOT NULL,
	`amount` integer NOT NULL,
	`fed_withholding` integer DEFAULT 0 NOT NULL,
	`income_date` text,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_income_year` ON `income_documents` (`year`);--> statement-breakpoint
CREATE INDEX `idx_income_year_form` ON `income_documents` (`year`,`form_type`);--> statement-breakpoint
CREATE TABLE `mileage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`date` text NOT NULL,
	`miles` integer NOT NULL,
	`payload_encrypted` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_mileage_year` ON `mileage_logs` (`year`);--> statement-breakpoint
CREATE INDEX `idx_mileage_year_date` ON `mileage_logs` (`year`,`date`);--> statement-breakpoint
CREATE TABLE `person_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`label` text NOT NULL,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_person_profiles_year` ON `person_profiles` (`year`);--> statement-breakpoint
CREATE TABLE `tax_years` (
	`year` integer PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
