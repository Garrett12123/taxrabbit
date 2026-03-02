CREATE TABLE `utility_bills` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`utility_type` text NOT NULL,
	`bill_date` text NOT NULL,
	`amount` integer NOT NULL,
	`payload_encrypted` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`year`) REFERENCES `tax_years`(`year`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_utility_bills_year` ON `utility_bills` (`year`);--> statement-breakpoint
CREATE INDEX `idx_utility_bills_year_type` ON `utility_bills` (`year`,`utility_type`);--> statement-breakpoint
CREATE INDEX `idx_utility_bills_year_date` ON `utility_bills` (`year`,`bill_date`);