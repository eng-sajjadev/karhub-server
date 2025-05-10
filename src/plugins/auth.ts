import Elysia, { t } from "elysia";
import db from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const auth = new Elysia({ prefix: "/auth" })

auth.post("/signup", async ({ body, set }) => {
    try {
        const userExist = await db.select().from(users).where(eq(users.email, body.email)).execute()
        if (userExist.length != 0) {
            set.status = 400
            return { ok: false, message: "User already exist" }
        }
        const newUser = await db.insert(users).values({ email: body.email, passwordHash: await Bun.password.hash(body.password) }).returning()
        const { id, emailVerificationToken, oauthAccessToken, emailVerificationTokenExpires, oauthProvider, oauthProviderId, passwordHash, oauthRefreshToken, ...data } = newUser[0]
        return { ok: true, message: "User created successfully , check your email account", data }
    } catch (error: any) {
        console.error(error.message);

        return { ok: false, message: "Internal error" }
    }
}, {
    body: t.Object({
        email: t.RegExp(/^\S+@\S+\.\S+$/),
        password: t.RegExp(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
    })
})

export default auth