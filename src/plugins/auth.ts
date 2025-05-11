import Elysia, { t } from "elysia";
import db from "../db";
import { passwordResetTokens, users } from "../db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email";
import { generateShortHexToken } from "../utils/tokenGenerator";
import jwt from "@elysiajs/jwt";

const auth = new Elysia({ prefix: "/auth" })

auth.use(
    jwt({
        name: 'jwt',
        secret: 'Fischl von Luftschloss Narfidort'
    })
).post("/signup",
    async ({ body, set }) => {
        // Use transaction for atomic operations
        const result = await db.transaction(async (tx) => {
            // Check if user exists (optimized with limit(1))
            const [existingUser] = await tx.select()
                .from(users)
                .where(eq(users.email, body.email))
                .limit(1)
                .execute();

            if (existingUser) {
                set.status = 400;
                return { ok: false, message: "Email already registered" };
            }

            // Generate token and hash password in parallel
            const [token, passwordHash] = await Promise.all([
                generateShortHexToken(),
                Bun.password.hash(body.password)
            ]);

            // Insert new user
            const [newUser] = await tx.insert(users)
                .values({
                    email: body.email,
                    passwordHash,
                    emailVerificationToken: token,
                    emailVerificationTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                })
                .returning();

            // Send verification email without waiting (fire and forget)
            sendVerificationEmail({ email: body.email, token })
                .catch(err => console.error("Email sending failed:", err));

            // Omit sensitive fields from response
            const { passwordHash: _, emailVerificationToken: __, ...safeUserData } = newUser;

            return {
                ok: true,
                data: safeUserData
            };
        });

        if (result.ok) {
            set.status = 201;
            return {
                ok: true,
                message: "Account created successfully. Please check your email for verification.",
                data: result.data
            };
        }

        return result;
    },
    {
        body: t.Object({
            email: t.String({
                format: "email",
                error: "Please provide a valid email address"
            }),
            password: t.RegExp(
                /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/, { error: "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character" }
            )
        }),
        error({ error }) {
            // Handle validation errors specifically
            if (Array.isArray(error)) {
                return {
                    ok: false,
                    message: "Validation failed",
                    errors: error.map(e => ({
                        field: e.path,
                        message: e.message
                    }))
                };
            }

            // Log unexpected errors
            console.error("Signup error:", error);

            return {
                ok: false,
                message: "An unexpected error occurred during registration"
            };
        }
    }
).post('/activation',
    async ({ body, set }) => {
        const result = await db.transaction(async (tx) => {
            const [user] = await tx.select()
                .from(users)
                .where(
                    and(
                        eq(users.email, body.email),
                        eq(users.emailVerificationToken, body.token)
                    )
                )
                .limit(1)
                .execute();

            if (!user) {
                set.status = 400;
                return { ok: false, message: "Invalid token or email" };
            }

            if (new Date() > user.emailVerificationTokenExpires!) {
                set.status = 400;
                return { ok: false, message: "Token has expired" };
            }

            await tx.update(users)
                .set({
                    emailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationTokenExpires: null
                })
                .where(eq(users.email, body.email));

            return { ok: true };
        });

        if (result.ok) {
            set.status = 201;
            return { ok: true, message: "Account verified successfully" };
        }

        return result;
    },
    {
        body: t.Object({
            token: t.String({
                minLength: 5,
                maxLength: 5,
                error: "Token must be exactly 5 characters"
            }),
            email: t.String({
                format: "email",
                error: "Please provide a valid email address"
            })
        }),
        error({ error }) {
            // Proper error handling for Elysia
            if (error instanceof Error) {
                return {
                    ok: false,
                    message: error.message
                };
            }

            return {
                ok: false,
                message: "Validation failed",
                // If you want to include validation details:
                details: Array.isArray(error) ? error.map(e => ({
                    path: e.path,
                    message: e.message
                })) : undefined
            };
        }
    }
).post("/activation/resend",
    async ({ body, set }) => {
        // Validate email format is already handled by Elysia's type system

        // Use transaction for atomic operations
        const result = await db.transaction(async (tx) => {
            const [user] = await tx.select()
                .from(users)
                .where(
                    and(
                        eq(users.email, body.email),
                        eq(users.emailVerified, false)
                    )
                )
                .limit(1)
                .execute();

            if (!user) return null;

            const token = await generateShortHexToken();

            // Parallelize email sending and DB update
            await Promise.all([
                sendVerificationEmail({ email: body.email, token }),
                tx.update(users)
                    .set({
                        emailVerificationToken: token,
                        emailVerificationTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    })
                    .where(eq(users.email, body.email))
            ]);

            return { ok: true };
        });

        if (result?.ok) {
            return { ok: true, message: "We sent an activation token for you" };
        }

        set.status = 400;
        return { ok: false, message: "Invalid email or account already verified" };
    },
    {
        body: t.Object({
            email: t.String({ format: "email", error: "Please provide a valid email address" })
        }),
        error({ code, error }) {
            switch (code) {
                case "VALIDATION":
                    return { ok: false, message: error.message };
                default:
                    return { ok: false, message: "Internal server error" };
            }
        }
    }
).post("/login",
    async ({ body, set, jwt }) => {
        try {
            // Find user with email
            const [user] = await db.select()
                .from(users)
                .where(eq(users.email, body.email))
                .limit(1)
                .execute();

            if (!user) {
                set.status = 401;
                return {
                    ok: false,
                    message: "Invalid credentials",
                    code: "INVALID_CREDENTIALS"
                };
            }

            // Check verification status
            if (!user.emailVerified) {
                set.status = 403;
                return {
                    ok: false,
                    message: "Please verify your email first",
                    code: "UNVERIFIED_ACCOUNT"
                };
            }

            // Handle OAuth-only users
            if (user.oauthProvider && !user.passwordHash) {
                set.status = 400;
                return {
                    ok: false,
                    message: `Please login with ${user.oauthProvider}`,
                    code: "OAUTH_ACCOUNT",
                    provider: user.oauthProvider
                };
            }

            // Verify password
            if (!(await Bun.password.verify(body.password, user.passwordHash!))) {
                set.status = 401;
                return {
                    ok: false,
                    message: "Invalid credentials",
                    code: "INVALID_CREDENTIALS"
                };
            }

            // Update last login (using your schema's timestamp format)
            await db.update(users)
                .set({
                    lastLoginAt: new Date(), // Unix timestamp
                    updatedAt: new Date()
                })
                .where(eq(users.id, user.id));

            // Generate JWT
            const token = await jwt.sign({
                id: user.id,
                email: user.email
            });

            // Return safe user data
            const { passwordHash, emailVerificationToken, oauthAccessToken, oauthRefreshToken, ...safeUserData } = user;

            return {
                ok: true,
                message: "Login successful",
                data: { safeUserData, token }
            };

        } catch (error) {
            console.error("Login error:", error);
            set.status = 500;
            return {
                ok: false,
                message: "Internal server error",
                code: "INTERNAL_ERROR"
            };
        }
    },
    {
        body: t.Object({
            email: t.String({ format: "email" }),
            password: t.String()
        })
    }
).post("/password-reset/request",
    async ({ body, set }) => {
        try {
            const [user] = await db.select()
                .from(users)
                .where(eq(users.email, body.email))
                .limit(1)
                .execute();

            if (!user) {
                // For security, don't reveal if the email exists or not
                set.status = 200;
                return {
                    ok: true,
                    message: "If an account exists with this email, a password reset link has been sent"
                };
            }

            // Generate token and expiration date
            const token = await generateShortHexToken();
            const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration

            // Create password reset token
            await db.insert(passwordResetTokens).values({
                userId: user.id,
                token,
                expiresAt
            }).execute();

            // Send email (fire and forget)
            sendPasswordResetEmail({ email: user.email, token })
                .catch(err => console.error("Failed to send password reset email:", err));

            return {
                ok: true,
                message: "If an account exists with this email, a password reset link has been sent"
            };
        } catch (error) {
            console.error("Password reset request error:", error);
            set.status = 500;
            return {
                ok: false,
                message: "Failed to process password reset request"
            };
        }
    },
    {
        body: t.Object({
            email: t.String({ format: "email" })
        })
    }
).post("/password-reset/validate",
    async ({ body, set }) => {
        try {
            // Find the token and check if it's valid
            const [tokenRecord] = await db.select()
                .from(passwordResetTokens)
                .innerJoin(users, eq(users.id, passwordResetTokens.userId))
                .where(
                    and(
                        eq(passwordResetTokens.token, body.token),
                        eq(users.email, body.email),
                        isNull(passwordResetTokens.usedAt)
                    )
                )
                .limit(1)
                .execute();

            if (!tokenRecord || !tokenRecord.password_reset_tokens) {
                set.status = 400;
                return {
                    ok: false,
                    message: "Invalid or expired token"
                };
            }

            const tokenData = tokenRecord.password_reset_tokens;

            // Check if token has expired
            if (new Date() > tokenData.expiresAt) {
                set.status = 400;
                return {
                    ok: false,
                    message: "Token has expired"
                };
            }

            return {
                ok: true,
                message: "Token is valid"
            };
        } catch (error) {
            console.error("Password reset validation error:", error);
            set.status = 500;
            return {
                ok: false,
                message: "Failed to validate token"
            };
        }
    },
    {
        body: t.Object({
            token: t.String(),
            email: t.String({ format: "email" })
        })
    }
).post("/password-reset/complete",
    async ({ body, set }) => {
        try {
            const result = await db.transaction(async (tx) => {
                // Find the token and user
                const [tokenRecord] = await tx.select()
                    .from(passwordResetTokens)
                    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
                    .where(
                        and(
                            eq(passwordResetTokens.token, body.token),
                            eq(users.email, body.email),
                            isNull(passwordResetTokens.usedAt)
                        )
                    )
                    .limit(1)
                    .execute();

                if (!tokenRecord || !tokenRecord.password_reset_tokens) {
                    set.status = 400;
                    return {
                        ok: false,
                        message: "Invalid or expired token"
                    };
                }

                const tokenData = tokenRecord.password_reset_tokens;

                // Check if token has expired
                if (new Date() > tokenData.expiresAt) {
                    set.status = 400;
                    return {
                        ok: false,
                        message: "Token has expired"
                    };
                }

                // Hash the new password
                const passwordHash = await Bun.password.hash(body.newPassword);

                // Update user password and mark token as used
                await Promise.all([
                    tx.update(users)
                        .set({
                            passwordHash,
                            updatedAt: new Date()
                        })
                        .where(eq(users.id, tokenData.userId)),
                    tx.update(passwordResetTokens)
                        .set({
                            usedAt: new Date()
                        })
                        .where(eq(passwordResetTokens.id, tokenData.id))
                ]);

                return {
                    ok: true
                };
            });

            return result;
        } catch (error) {
            console.error("Password reset completion error:", error);
            set.status = 500;
            return {
                ok: false,
                message: "Failed to reset password"
            };
        }
    },
    {
        body: t.Object({
            token: t.String(),
            email: t.String({ format: "email" }),
            newPassword: t.RegExp(
                /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
                {
                    error: "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character"
                }
            )
        })
    }
);

export default auth