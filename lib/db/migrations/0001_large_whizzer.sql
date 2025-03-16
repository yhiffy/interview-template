CREATE TABLE `Invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`vendorName` text NOT NULL,
	`customerName` text NOT NULL,
	`invoiceNumber` text NOT NULL,
	`invoiceDate` text,
	`dueDate` text,
	`amount` text,
	`lineItems` blob,
	`fileHash` text,
	`tokenUsage` integer
);
