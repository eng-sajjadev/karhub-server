import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import db from "../db";
import { labels, projects, taskLabels, tasks } from "../db/schema";
import { and, eq, inArray } from "drizzle-orm"; // Added inArray

const task = new Elysia({ prefix: "/task" })
    .use(jwt({
        name: "jwt",
        secret: Bun.env.JWT_SECRET
    })).post("",
        async ({ body, set, jwt, headers }) => {
            try {
                // Authorization header check
                const authHeader = headers['authorization'];
                if (!authHeader) {
                    set.status = 401;
                    return { ok: false, message: "Authorization header missing" };
                }

                // JWT verification
                const token = authHeader.split(' ')[1];
                if (!token) {
                    set.status = 401;
                    return { ok: false, message: "Token missing" };
                }

                const user = await jwt.verify(token) as { id: number, email: string };
                const userId = user?.id
                if (!user || !userId) {
                    set.status = 401;
                    return { ok: false, message: "Invalid token" };
                }

                // Project validation
                if (body.projectId) {
                    const [project] = await db.select()
                        .from(projects)
                        .where(
                            and(
                                eq(projects.id, body.projectId),
                                eq(projects.userId, userId) // Use numeric ID
                            )
                        )
                        .limit(1)
                        .execute();

                    if (!project) {
                        set.status = 404;
                        return { ok: false, message: "Project not found" };
                    }
                }

                // Task creation
                const result = await db.transaction(async (tx) => {
                    const [newTask] = await tx.insert(tasks)
                        .values({
                            title: body.title,
                            description: body.description,
                            status: body.status || 'todo',
                            priority: body.priority || 'medium',
                            dueDate: body.dueDate ? new Date(body.dueDate) : null,
                            projectId: body.projectId || null,
                            userId: userId // Use numeric ID
                        })
                        .returning();

                    // Label processing
                    if (body.labelIds?.length) {
                        const userLabels = await tx.select()
                            .from(labels)
                            .where(
                                and(
                                    eq(labels.userId, userId), // Use numeric ID
                                    inArray(labels.id, body.labelIds)
                                )
                            )
                            .execute();

                        if (userLabels.length !== body.labelIds.length) {
                            throw new Error("Some labels don't exist or don't belong to user");
                        }

                        await tx.insert(taskLabels)
                            .values(
                                body.labelIds.map(labelId => ({
                                    taskId: newTask.id,
                                    labelId
                                }))
                            )
                            .execute();
                    }

                    return newTask;
                });

                return { ok: true, data: result };

            } catch (error) {
                console.error("Task creation error:", error);
                set.status = 500;
                return {
                    ok: false,
                    message: "Failed to create task",
                    error: error instanceof Error ? error.message : "Unknown error"
                };
            }
        },
        {
            body: t.Object({
                title: t.String({ minLength: 1, maxLength: 255 }),
                description: t.Optional(t.String()),
                status: t.Optional(t.Union([
                    t.Literal('todo'),
                    t.Literal('in_progress'),
                    t.Literal('done'),
                    t.Literal('archived')
                ])),
                priority: t.Optional(t.Union([
                    t.Literal('low'),
                    t.Literal('medium'),
                    t.Literal('high')
                ])),
                dueDate: t.Optional(t.String({ format: 'date-time' })),
                projectId: t.Optional(t.Numeric()),
                labelIds: t.Optional(t.Array(t.Numeric()))
            }),
            beforeHandle({ headers, set }) {
                if (!headers['authorization']) {
                    set.status = 401;
                    return { ok: false, message: "Authorization header required" };
                }
            }
        }
    );

export default task;