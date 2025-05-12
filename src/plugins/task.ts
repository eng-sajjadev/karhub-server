// elysia router
import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import db from "../db";
import { labels, projects, taskLabels, tasks } from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";

const task = new Elysia({ prefix: "/task" })
    .use(jwt({
        name: "jwt",
        secret: Bun.env.JWT_SECRET
    }))
    .derive(async ({ jwt, headers, set }) => { // Use .derive instead of .decorate and .guard
        const authHeader = headers['authorization'];
        if (!authHeader) {
            set.status = 401;
            return { userId: null, message: "Authorization header missing" }; // Return null userId
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            set.status = 401;
            return { userId: null, message: "Token missing" }; // Return null userId
        }

        try {
            const user = await jwt.verify(token) as { id: number, email: string };
            if (!user || !user.id) {
                set.status = 401;
                return { userId: null, message: "Invalid token" }; // Return null userId
            }
            return { userId: user.id }; // Return the userId
        } catch (error) {
            set.status = 401;
            return { userId: null, message: "Invalid token" }; // Handle JWT verification errors
        }
    })
    .post("",
        async ({ body, set, userId }) => { // Access userId directly

            if (!userId) {
                set.status = 401;
                return { ok: false, message: "Unauthorized" }; // Handle missing userId
            }

            try {
                // Project validation
                if (body.projectId) {
                    const [project] = await db.select()
                        .from(projects)
                        .where(
                            and(
                                eq(projects.id, body.projectId),
                                eq(projects.userId, userId)
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
                            userId: userId
                        })
                        .returning();

                    // Label processing
                    if (body.labelIds?.length) {
                        const userLabels = await tx.select()
                            .from(labels)
                            .where(
                                and(
                                    eq(labels.userId, userId),
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
            })
        }
    ).get("", async ({ userId, set }) => {
        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }

        try {
            const tasksForUser = await db.select().from(tasks).where(eq(tasks.userId, userId));

            return { ok: true, data: tasksForUser };
        } catch (error) {
            console.error("Error fetching tasks:", error);
            set.status = 500;
            return { ok: false, message: "Failed to fetch tasks" };
        }
    }).patch("/:taskId", async ({ userId, params, body, set }) => {
        const { taskId } = params;
        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }

        // Validate taskId is present and is a number
        const id = parseInt(taskId);
        if (isNaN(id)) {
            set.status = 400;
            return { ok: false, message: "Invalid task ID" };
        }

        // Prepare fields to update (only those provided)
        const updateData: any = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
        if (body.projectId !== undefined) updateData.projectId = body.projectId;
        if (body.labelIds !== undefined) {
            // Handle label association update (if needed)
            // For simplicity, we'll ignore label updates here, or you can extend this.
        }

        if (Object.keys(updateData).length === 0) {
            set.status = 400;
            return { ok: false, message: "No fields to update" };
        }

        try {
            // Verify the task belongs to the user
            const [task] = await db.select()
                .from(tasks)
                .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
                .limit(1)
                .execute();

            if (!task) {
                set.status = 404;
                return { ok: false, message: "Task not found or not authorized" };
            }

            // Perform the update
            await db.update(tasks)
                .set(updateData)
                .where(eq(tasks.id, id))
                .execute();

            // Optionally, fetch the updated task to return
            const [updatedTask] = await db.select()
                .from(tasks)
                .where(eq(tasks.id, id))
                .execute();

            return { ok: true, data: updatedTask };

        } catch (error) {
            console.error("Update task error:", error);
            set.status = 500;
            return { ok: false, message: "Failed to update task" };
        }
    }, {
        body: t.Object({
            title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
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
        })
    }).delete("/:taskId", async ({ userId, params, set }) => {
        const { taskId } = params;

        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }

        // Validate taskId
        const id = parseInt(taskId);
        if (isNaN(id)) {
            set.status = 400;
            return { ok: false, message: "Invalid task ID" };
        }

        try {
            // Verify task ownership
            const [task] = await db.select()
                .from(tasks)
                .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
                .limit(1)
                .execute();

            if (!task) {
                set.status = 404;
                return { ok: false, message: "Task not found or unauthorized" };
            }

            // Delete the task
            await db.delete(tasks)
                .where(eq(tasks.id, id))
                .execute();

            return { ok: true, message: "Task deleted successfully" };

        } catch (error) {
            console.error("Delete task error:", error);
            set.status = 500;
            return { ok: false, message: "Failed to delete task" };
        }
    });



export default task;
