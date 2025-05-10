import { relations } from "drizzle-orm/relations";
import { users, labels, passwordResetTokens, projects, tasks, subtasks, taskLabels } from "./schema";

export const labelsRelations = relations(labels, ({one, many}) => ({
	user: one(users, {
		fields: [labels.userId],
		references: [users.id]
	}),
	taskLabels: many(taskLabels),
}));

export const usersRelations = relations(users, ({many}) => ({
	labels: many(labels),
	passwordResetTokens: many(passwordResetTokens),
	projects: many(projects),
	tasks: many(tasks),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	user: one(users, {
		fields: [projects.userId],
		references: [users.id]
	}),
	tasks: many(tasks),
}));

export const subtasksRelations = relations(subtasks, ({one}) => ({
	task: one(tasks, {
		fields: [subtasks.taskId],
		references: [tasks.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	subtasks: many(subtasks),
	taskLabels: many(taskLabels),
	user: one(users, {
		fields: [tasks.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
}));

export const taskLabelsRelations = relations(taskLabels, ({one}) => ({
	label: one(labels, {
		fields: [taskLabels.labelId],
		references: [labels.id]
	}),
	task: one(tasks, {
		fields: [taskLabels.taskId],
		references: [tasks.id]
	}),
}));