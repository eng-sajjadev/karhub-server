import { sqliteTable, AnySQLiteColumn, index, foreignKey, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const labels = sqliteTable("labels", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	color: text().default("#94a3b8").notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	index("labels_user_id_idx").on(table.userId),
]);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	token: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	usedAt: integer("used_at"),
},
(table) => [
	uniqueIndex("password_reset_tokens_token_unique").on(table.token),
]);

export const projects = sqliteTable("projects", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	description: text(),
	color: text().default("#3b82f6").notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	index("projects_user_id_idx").on(table.userId),
]);

export const subtasks = sqliteTable("subtasks", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	title: text().notNull(),
	isCompleted: integer("is_completed").default(false).notNull(),
	taskId: integer("task_id").notNull().references(() => tasks.id),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	completedAt: integer("completed_at"),
},
(table) => [
	index("subtasks_task_id_idx").on(table.taskId),
]);

export const taskLabels = sqliteTable("task_labels", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	taskId: integer("task_id").notNull().references(() => tasks.id),
	labelId: integer("label_id").notNull().references(() => labels.id),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	index("task_labels_label_id_idx").on(table.labelId),
	index("task_labels_task_id_idx").on(table.taskId),
	uniqueIndex("task_labels_unique_idx").on(table.taskId, table.labelId),
]);

export const tasks = sqliteTable("tasks", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	title: text().notNull(),
	description: text(),
	status: text().default("todo").notNull(),
	priority: text().default("medium").notNull(),
	dueDate: integer("due_date"),
	projectId: integer("project_id").references(() => projects.id),
	userId: integer("user_id").notNull().references(() => users.id),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	completedAt: integer("completed_at"),
},
(table) => [
	index("tasks_status_idx").on(table.status),
	index("tasks_project_id_idx").on(table.projectId),
	index("tasks_user_id_idx").on(table.userId),
]);

export const users = sqliteTable("users", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: integer("email_verified").default(false).notNull(),
	emailVerificationToken: text("email_verification_token"),
	emailVerificationTokenExpires: integer("email_verification_token_expires"),
	passwordHash: text("password_hash"),
	oauthProvider: text("oauth_provider"),
	oauthProviderId: text("oauth_provider_id"),
	oauthAccessToken: text("oauth_access_token"),
	oauthRefreshToken: text("oauth_refresh_token"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	lastLoginAt: integer("last_login_at"),
},
(table) => [
	index("users_oauth_idx").on(table.oauthProvider, table.oauthProviderId),
	uniqueIndex("users_email_idx").on(table.email),
	uniqueIndex("users_email_unique").on(table.email),
]);

