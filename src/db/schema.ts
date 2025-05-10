import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Users Table
export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    emailVerificationToken: text("email_verification_token"),
    emailVerificationTokenExpires: integer("email_verification_token_expires", { mode: "timestamp" }),
    passwordHash: text("password_hash"),
    oauthProvider: text("oauth_provider", { enum: ["google", "github", "apple"] }),
    oauthProviderId: text("oauth_provider_id"),
    oauthAccessToken: text("oauth_access_token"),
    oauthRefreshToken: text("oauth_refresh_token"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
}, (table) => ({
    users_email_idx: uniqueIndex("users_email_idx").on(table.email),
    users_oauth_idx: index("users_oauth_idx").on(table.oauthProvider, table.oauthProviderId),
}));

// Password Reset Tokens
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp" }),
});

// Projects Table
export const projects = sqliteTable("projects", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("#3b82f6"),
    userId: integer("user_id").notNull().references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
}, (table) => ({
    projects_user_id_idx: index("projects_user_id_idx").on(table.userId),
}));

// Labels Table
export const labels = sqliteTable("labels", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#94a3b8"),
    userId: integer("user_id").notNull().references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
}, (table) => ({
    labels_user_id_idx: index("labels_user_id_idx").on(table.userId),
}));

// Tasks Table
export const tasks = sqliteTable("tasks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: ["todo", "in_progress", "done", "archived"] })
        .notNull()
        .default("todo"),
    priority: text("priority", { enum: ["low", "medium", "high"] })
        .notNull()
        .default("medium"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    projectId: integer("project_id").references(() => projects.id),
    userId: integer("user_id").notNull().references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
    completedAt: integer("completed_at", { mode: "timestamp" }),
}, (table) => ({
    tasks_user_id_idx: index("tasks_user_id_idx").on(table.userId),
    tasks_project_id_idx: index("tasks_project_id_idx").on(table.projectId),
    tasks_status_idx: index("tasks_status_idx").on(table.status),
}));

// Subtasks Table
export const subtasks = sqliteTable("subtasks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
    taskId: integer("task_id").notNull().references(() => tasks.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
    completedAt: integer("completed_at", { mode: "timestamp" }),
}, (table) => ({
    subtasks_task_id_idx: index("subtasks_task_id_idx").on(table.taskId),
}));

// Task Labels Junction Table
export const taskLabels = sqliteTable("task_labels", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id").notNull().references(() => tasks.id),
    labelId: integer("label_id").notNull().references(() => labels.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
}, (table) => ({
    task_labels_unique_idx: uniqueIndex("task_labels_unique_idx").on(table.taskId, table.labelId),
    task_labels_task_id_idx: index("task_labels_task_id_idx").on(table.taskId),
    task_labels_label_id_idx: index("task_labels_label_id_idx").on(table.labelId),
}));

// 2. Then define all relations after all tables are defined

export const usersRelations = relations(users, ({ many }) => ({
    projects: many(projects),
    tasks: many(tasks),
    labels: many(labels),
    passwordResetTokens: many(passwordResetTokens),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
    user: one(users, {
        fields: [passwordResetTokens.userId],
        references: [users.id],
    }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    user: one(users, {
        fields: [projects.userId],
        references: [users.id],
    }),
    tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    user: one(users, {
        fields: [tasks.userId],
        references: [users.id],
    }),
    project: one(projects, {
        fields: [tasks.projectId],
        references: [projects.id],
    }),
    subtasks: many(subtasks),
    labels: many(taskLabels),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
    task: one(tasks, {
        fields: [subtasks.taskId],
        references: [tasks.id],
    }),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
    user: one(users, {
        fields: [labels.userId],
        references: [users.id],
    }),
    tasks: many(taskLabels),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
    task: one(tasks, {
        fields: [taskLabels.taskId],
        references: [tasks.id],
    }),
    label: one(labels, {
        fields: [taskLabels.labelId],
        references: [labels.id],
    }),
}));