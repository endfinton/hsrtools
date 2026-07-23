CREATE TABLE `planner_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`character_id` text NOT NULL,
	`owned` integer DEFAULT false NOT NULL,
	`wishlisted` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `planner_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planner_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`current_tickets` integer DEFAULT 0 NOT NULL,
	`pity` integer DEFAULT 0 NOT NULL,
	`guaranteed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tier_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`patch` text NOT NULL,
	`rows` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
