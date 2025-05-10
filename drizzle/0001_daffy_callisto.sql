DROP INDEX "labels_user_id_idx";--> statement-breakpoint
DROP INDEX "password_reset_tokens_token_unique";--> statement-breakpoint
DROP INDEX "projects_user_id_idx";--> statement-breakpoint
DROP INDEX "subtasks_task_id_idx";--> statement-breakpoint
DROP INDEX "task_labels_unique_idx";--> statement-breakpoint
DROP INDEX "task_labels_task_id_idx";--> statement-breakpoint
DROP INDEX "task_labels_label_id_idx";--> statement-breakpoint
DROP INDEX "tasks_user_id_idx";--> statement-breakpoint
DROP INDEX "tasks_project_id_idx";--> statement-breakpoint
DROP INDEX "tasks_status_idx";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
DROP INDEX "users_oauth_idx";--> statement-breakpoint
ALTER TABLE `labels` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
CREATE INDEX `labels_user_id_idx` ON `labels` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `projects_user_id_idx` ON `projects` (`user_id`);--> statement-breakpoint
CREATE INDEX `subtasks_task_id_idx` ON `subtasks` (`task_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_labels_unique_idx` ON `task_labels` (`task_id`,`label_id`);--> statement-breakpoint
CREATE INDEX `task_labels_task_id_idx` ON `task_labels` (`task_id`);--> statement-breakpoint
CREATE INDEX `task_labels_label_id_idx` ON `task_labels` (`label_id`);--> statement-breakpoint
CREATE INDEX `tasks_user_id_idx` ON `tasks` (`user_id`);--> statement-breakpoint
CREATE INDEX `tasks_project_id_idx` ON `tasks` (`project_id`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_oauth_idx` ON `users` (`oauth_provider`,`oauth_provider_id`);--> statement-breakpoint
ALTER TABLE `labels` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `projects` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `projects` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `subtasks` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `subtasks` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `task_labels` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `tasks` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `tasks` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.471Z"';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.470Z"';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT '"2025-05-10T15:46:23.470Z"';