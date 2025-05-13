import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { projects, tasks } from "../db/schema";
import db from "../db";
import { and, eq } from "drizzle-orm";

const project = new Elysia({ prefix: "/project" }).use(jwt({
    name: "jwt",
    secret: Bun.env.JWT_SECRET
}))
    .derive(async ({ jwt, headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader) {
            set.status = 401;
            return { userId: null, message: "Authorization header missing" };
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            set.status = 401;
            return { userId: null, message: "Token missing" };
        }

        try {
            const user = await jwt.verify(token) as { id: number; email: string };
            if (!user || !user.id) {
                set.status = 401;
                return { userId: null, message: "Invalid token" };
            }
            return { userId: user.id };
        } catch (error) {
            set.status = 401;
            return { userId: null, message: "Invalid token" };
        }
    }).post("/", async ({ body, set, userId }) => {
        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }

        try {

            const [newProject] = await db
                .insert(projects)
                .values({
                    name: body.name,
                    description: body.description || null,
                    color: body.color,
                    userId: userId
                })
                .returning();

            return { ok: true, data: newProject };

        } catch (error) {
            console.error("Create project error:", error);
            set.status = 500;
            return { ok: false, message: "Failed to create project" };
        }
    }, {
        body: t.Object({
            name: t.String({ minLength: 1, maxLength: 255 }),
            description: t.Optional(t.String()),
            color: t.Optional(t.RegExp(/(?:#|0x)(?:[a-f0-9]{3}|[a-f0-9]{6})\b|(?:rgb|hsl)a?\([^\)]*\)/ig))
        })
    }).put("/:id", async ({ params, body, set, userId }) => {
        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }

        try {
            // First check if the project exists and belongs to the user
            const [existingProject] = await db
                .select()
                .from(projects)
                .where(
                    eq(projects.id, params.id)
                );

            if (!existingProject) {
                set.status = 404;
                return { ok: false, message: "Project not found" };
            }

            if (existingProject.userId !== userId) {
                set.status = 403;
                return { ok: false, message: "You don't have permission to update this project" };
            }

            // Check if any changes are provided
            const hasChanges =
                (body.name !== undefined && body.name !== existingProject.name) ||
                (body.description !== undefined && body.description !== existingProject.description) ||
                (body.color !== undefined && body.color !== existingProject.color);

            if (!hasChanges) {
                set.status = 400;
                return { ok: false, message: "No changes provided" };
            }

            // Update the project
            const [updatedProject] = await db
                .update(projects)
                .set({
                    name: body.name ?? existingProject.name,
                    description: body.description ?? existingProject.description,
                    color: body.color ?? existingProject.color,
                    updatedAt: new Date()
                })
                .where(
                    eq(projects.id, params.id)
                )
                .returning();

            return { ok: true, data: updatedProject };

        } catch (error) {
            console.error("Update project error:", error);
            set.status = 500;
            return { ok: false, message: "Failed to update project" };
        }
    }, {
        params: t.Object({
            id: t.Numeric()
        }),
        body: t.Object({
            name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
            description: t.Optional(t.String()),
            color: t.Optional(t.RegExp(/(?:#|0x)(?:[a-f0-9]{3}|[a-f0-9]{6})\b|(?:rgb|hsl)a?\([^\)]*\)/ig))
        })
    }).get("/", async ({ set, userId }) => {
        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }

        try {
            const userProjects = await db
                .select()
                .from(projects)
                .where(
                    eq(projects.userId, userId)
                )
                .orderBy(projects.createdAt);

            return { ok: true, data: userProjects };
        } catch (error) {
            console.error("Get projects error:", error);
            set.status = 500;
            return { ok: false, message: "Failed to fetch projects" };
        }
    }).get("/:id", async ({ params, set, userId }) => {
        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }

        try {
            const [project] = await db
                .select()
                .from(projects)
                .where(
                    and(
                        eq(projects.id, params.id),
                        eq(projects.userId, userId)
                    )
                );

            if (!project) {
                set.status = 404;
                return { ok: false, message: "Project not found or you don't have permission" };
            }

            return { ok: true, data: project };
        } catch (error) {
            console.error("Get project error:", error);
            set.status = 500;
            return { ok: false, message: "Failed to fetch project" };
        }
    }, {
        params: t.Object({
            id: t.Numeric()
        })
    }).delete("/:id", async ({ params, set, userId }) => {
        if (!userId) {
            set.status = 401;
            return { ok: false, message: "Unauthorized" };
        }


        if (isNaN(params.id)) {
            set.status = 400;
            return { ok: false, message: "Invalid project ID" };
        }

        try {
            // Verify project exists and belongs to user
            const [project] = await db
                .select()
                .from(projects)
                .where(and(
                    eq(projects.id, params.id),
                    eq(projects.userId, userId)
                ))
                .limit(1);

            if (!project) {
                set.status = 404;
                return { ok: false, message: "Project not found or not authorized" };
            }

            // Use transaction for atomic operations
            await db.transaction(async (tx) => {
                // Update all tasks in the project to remove project association
                await tx
                    .update(tasks)
                    .set({ projectId: null })
                    .where(eq(tasks.projectId, params.id));

                // Delete the project
                await tx
                    .delete(projects)
                    .where(eq(projects.id, params.id));
            });

            return { ok: true, message: "Project deleted successfully" };

        } catch (error) {
            console.error("Delete project error:", error);
            set.status = 500;
            return { ok: false, message: "Failed to delete project" };
        }
    }, {
        params: t.Object({
            id: t.Numeric()
        })
    })

export default project