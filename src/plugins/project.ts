import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { projects } from "../db/schema";
import db from "../db";

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
    })
    .post("/", async ({ body, set, userId }) => {
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
    })

export default project