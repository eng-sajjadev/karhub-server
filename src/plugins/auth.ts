import Elysia, { t } from "elysia";
import db from "../db";
import { users } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { sendVerificationEmail } from "../utils/email";
import { generateShortHexToken } from "../utils/tokenGenerator";

const auth = new Elysia({ prefix: "/auth" })

auth.post("/signup", async ({ body, set }) => {
    try {
        const userExist = await db.select().from(users).where(eq(users.email, body.email)).execute()
        if (userExist.length != 0) {
            set.status = 400
            return { ok: false, message: "User already exist" }
        }
        const token = await generateShortHexToken()
        const newUser = await db.insert(users).values({ email: body.email, passwordHash: await Bun.password.hash(body.password), emailVerificationToken: token, emailVerificationTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }).returning()
        const { id, emailVerificationToken, oauthAccessToken, emailVerificationTokenExpires, oauthProvider, oauthProviderId, passwordHash, oauthRefreshToken, ...data } = newUser[0]
        sendVerificationEmail({ email: data.email, token })
        set.status = 201
        return { ok: true, message: "User created successfully , check your email account", data }
    } catch (error: any) {
        console.error(error.message);
        set.status = 500
        return { ok: false, message: "Internal error" }
    }
}, {
    body: t.Object({
        email: t.String({ format: "email" }),
        password: t.RegExp(/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
    })
}).post('/activation', async ({ body, set }) => {
    try {

        const user = await db.select().from(users).where(and(eq(users.email, body.email), eq(users.emailVerificationToken, body.token))).execute()

        if (user.length == 0) {
            set.status = 400
            return { ok: false, message: "Token is not valid" }
        }
        if (new Date() > user[0].emailVerificationTokenExpires!!) {
            set.status = 400
            return { ok: false, message: "Token is expired" }
        }

        await db.update(users).set({ emailVerified: true, emailVerificationToken: null }).where(eq(users.email, body.email))
        set.status = 201
        return { ok: true, message: "Your account verified successfully" }
    } catch (error: any) {
        set.status = 500
        return { ok: false, message: "Internal error" }

    }
}, {
    body: t.Object({
        token: t.String({ minLength: 5, maxLength: 5 }),
        email: t.String({ format: "email" })
    })
})

export default auth