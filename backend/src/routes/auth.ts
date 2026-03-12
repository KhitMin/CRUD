import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db";
import { users } from "../schemas/user_schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET as string;

// ─── Schemas ─────────────────────────────────────────────────
const registerSchema = z.object({
    name: z.string().min(1, "Name cannot be empty"),
    email: z.string().min(1, "Email cannot be empty").email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phoneNo: z.string().optional(),
    description: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().min(1, "Email cannot be empty").email("Invalid email format"),
    password: z.string().min(1, "Password cannot be empty"),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

// ─── Routes ──────────────────────────────────────────────────
export async function authRoutes(fastify: FastifyInstance) {

    // ─── POST /auth/register ────────────────────────────────────
    fastify.post<{ Body: RegisterInput }>("/auth/register", {
        schema: {
            tags: ["Auth"],
            summary: "Register a new user",
            body: {
                type: "object",
                properties: {
                    name: { type: "string", description: "User's full name" },
                    email: { type: "string", description: "User's email" },
                    password: { type: "string", description: "Password (min 8 characters)" },
                    phoneNo: { type: "string", description: "Phone number" },
                    description: { type: "string", description: "About the user" },
                },
            },
            response: {
                201: {
                    description: "User registered successfully",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                        data: {
                            type: "object",
                            properties: {
                                id: { type: "string", format: "uuid" },
                                name: { type: "string" },
                                email: { type: "string" },
                                role:  { type: "string", enum: ["admin", "user"] },
                            },
                        },
                    },
                },
                400: {
                    description: "Validation error",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        errors: {
                            type: "object",
                            additionalProperties: {
                                type: "array",
                                items: { type: "string" },
                            },
                        },
                    },
                },
                409: {
                    description: "Email already exists",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
                500: {
                    description: "Internal server error",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const result = registerSchema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send({
                success: false,
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { name, email, password, phoneNo, description } = result.data;

        try {
            // Password hash လုပ်တယ်
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const [newUser] = await db
                .insert(users)
                .values({ name, email, password: hashedPassword, phoneNo, description })
                .returning({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    role:  users.role,
                });

            return reply.status(201).send({
                success: true,
                message: "User registered successfully",
                data: newUser,
            });
        } catch (err: any) {
            const pgError = err.cause ?? err;

            if (pgError.code === "23505") {
                return reply.status(409).send({
                    success: false,
                    message: "Email already exists",
                });
            }

            fastify.log.error(err);
            return reply.status(500).send({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // ─── POST /auth/login ───────────────────────────────────────
    fastify.post<{ Body: LoginInput }>("/auth/login", {
        schema: {
            tags: ["Auth"],
            summary: "Login",
            body: {
                type: "object",
                properties: {
                    email: { type: "string", description: "User's email" },
                    password: { type: "string", description: "User's password" },
                },
            },
            response: {
                200: {
                    description: "Login successful",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        token: { type: "string" },
                        data: {
                            type: "object",
                            properties: {
                                id: { type: "string", format: "uuid" },
                                name: { type: "string" },
                                email: { type: "string" },
                                role:  { type: "string", enum: ["admin", "user"] },
                            },
                        },
                    },
                },
                400: {
                    description: "Validation error",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        errors: {
                            type: "object",
                            additionalProperties: {
                                type: "array",
                                items: { type: "string" },
                            },
                        },
                    },
                },
                401: {
                    description: "Invalid credentials",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
                500: {
                    description: "Internal server error",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const result = loginSchema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send({
                success: false,
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { email, password } = result.data;

        try {
            // Email နဲ့ user ရှာတယ်
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email));

            if (!user) {
                return reply.status(401).send({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Password စစ်တယ်
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return reply.status(401).send({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // JWT token generate လုပ်တယ်
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"] }
            );

            return reply.status(200).send({
                success: true,
                token,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role:  user.role,
                },
            });
        } catch (err) {
            fastify.log.error(err);

            return reply.status(500).send({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // ─── POST /auth/logout ──────────────────────────────────────
    fastify.post("/auth/logout", {
        schema: {
            tags: ["Auth"],
            summary: "Logout",
            response: {
                200: {
                    description: "Logout successful",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
            },
        },
    }, async (request, reply) => {
        // JWT က stateless မို့ server side မှာ ဘာမှ မလုပ်ဘဲ
        // client side မှာ token ကို ဖျက်ပစ်ရုံပဲ
        return reply.status(200).send({
            success: true,
            message: "Logged out successfully",
        });
    });

}