import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db";
import { posts } from "../schemas/post_schema";
import { users } from "../schemas/user_schema";
import { authenticate, authorizePostOwner } from "../middlewares/authenticate";
import { eq, desc, sql } from "drizzle-orm";
import { error } from "node:console";

// ─── Schemas ──────────────────────────────────────────────────
const createPostSchema = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    content: z.string().min(1, "Content cannot be empty"),
});

const updatePostSchema = z.object({
    title: z.string().min(1, "Title cannot be empty").optional(),
    content: z.string().min(1, "Content cannot be empty").optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

type CreatePostInput = z.infer<typeof createPostSchema>;
type UpdatePostInput = z.infer<typeof updatePostSchema>;

// ─── Response Properties ──────────────────────────────────────
const postResponseProperties = {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    title: { type: "string" },
    content: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
};

export async function postRoutes(fastify: FastifyInstance) {

    // ─── POST /posts ──────────────────────────────────────────────
    fastify.post<{ Body: CreatePostInput }>("/posts", {
        schema: {
            tags: ["Posts"],
            summary: "Create a new post (Login required)",
            security: [{ bearerAuth: [] }],
            body: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Post title" },
                    content: { type: "string", description: "Post content" },
                },
            },
            response: {
                201: {
                    description: "Post created successfully",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        data: { type: "object", properties: postResponseProperties },
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
                    description: "Unauthorized",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                        error_detail: { type: "string" },
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
        preHandler: [authenticate],
    }, async (request, reply) => {
        const result = createPostSchema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send({
                success: false,
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { title, content } = result.data;

        // user_id ကို token ထဲကနေ ယူတယ် — body ကနေ မယူဘူး
        const userId = request.user!.id;

        try {
            const [newPost] = await db
                .insert(posts)
                .values({ userId, title, content })
                .returning();

            return reply.status(201).send({
                success: true,
                data: newPost,
            });
        } catch (err) {
            fastify.log.error(err);

            return reply.status(500).send({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // ─── GET /posts ───────────────────────────────────────────────
    fastify.get<{ Querystring: { page?: number; limit?: number }}>("/posts", {
        schema: {
            tags: ["Posts"],
            summary: "Get all posts (Login required)",
            security: [{ bearerAuth: [] }],
            querystring: {
                type: "object",
                properties: {
                    page: { type: "number", default: 1, description: "Page number" },
                    limit: { type: "number", default: 10, description: "Items per page" },
                },
            },
            response: {
                200: {
                    description: "List of posts",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        data: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string", format: "uuid" },
                                    title: { type: "string" },
                                    content: { type: "string" },
                                    createdAt: { type: "string", format: "date-time" },
                                    updatedAt: { type: "string", format: "date-time" },
                                    user: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string", format: "uuid" },
                                            name: { type: "string" },
                                            email: { type: "string" },
                                        },
                                    },
                                },
                            },
                        },
                        meta: {
                            type: "object",
                            properties: {
                                total: { type: "number" },
                                page: { type: "number" },
                                limit: { type: "number" },
                                totalPages: { type: "number" },
                            },
                        },
                    },
                },
                401: {
                    description: "Unauthorized",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                        error_detail: { type: "string" },
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
        preHandler: [authenticate],
    }, async (request, reply) => {
        const { page, limit } = paginationSchema.parse(request.query);  // ← ထည့်
        const offset = (page - 1) * limit;
        try {
            const [allPosts, total] = await Promise.all([
                db
                    .select({
                        id: posts.id,
                        title: posts.title,
                        content: posts.content,
                        createdAt: posts.createdAt,
                        updatedAt: posts.updatedAt,
                        user: {
                            id: users.id,
                            name: users.name,
                            email: users.email,
                        },
                    })
                    .from(posts)
                    .leftJoin(users, eq(posts.userId, users.id))
                    .orderBy(desc(posts.createdAt))
                    .limit(limit)
                    .offset(offset),

                db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(posts),
            ]);

            return reply.status(200).send({
                success: true,
                data: allPosts,
                meta: {
                    total: total[0].count,
                    page,
                    limit,
                    totalPages: Math.ceil(total[0].count / limit),
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

    // ─── GET /posts/byUser/:userId ──────────────────────────────────
    fastify.get<{ Params: { userId: string }; Querystring: { page?: number; limit?: number }; }>("/posts/byUser/:userId", {
        schema: {
            tags: ["Posts"],
            summary: "Get all posts by user ID (Login required)",
            security: [{ bearerAuth: [] }],
            params: {
                type: "object",
                properties: {
                    userId: { type: "string", format: "uuid", description: "User ID" },
                },
            },
            querystring: {
                type: "object",
                properties: {
                    page: { type: "number", default: 1, description: "Page number" },
                    limit: { type: "number", default: 10, description: "Items per page" },
                },
            },
            response: {
                200: {
                    description: "List of posts by user",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        data: {
                            type: "array",
                            items: { type: "object", properties: postResponseProperties },
                        },
                        meta: {
                            type: "object",
                            properties: {
                                total: { type: "number" },
                                page: { type: "number" },
                                limit: { type: "number" },
                                totalPages: { type: "number" },
                            },
                        },
                    },
                },
                401: {
                    description: "Unauthorized",
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
        preHandler: [authenticate],
    }, async (request, reply) => {
        const { userId } = request.params;
        const { page, limit } = paginationSchema.parse(request.query);
        const offset = (page - 1) * limit;

        try {
            const [userPosts, total] = await Promise.all([
                db
                    .select()
                    .from(posts)
                    .where(eq(posts.userId, userId))    // ← idx_posts_user_id သုံးတယ်
                    .orderBy(desc(posts.createdAt))     // ← idx_posts_created_at သုံးတယ်
                    .limit(limit)
                    .offset(offset),

                db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(posts)
                    .where(eq(posts.userId, userId)),   // ← user ရဲ့ post count သက်သက်
            ]);
            
            return reply.status(200).send({
                success: true,
                data: userPosts,
                meta: {
                    total: total[0].count,
                    page,
                    limit,
                    totalPages: Math.ceil(total[0].count / limit),
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

    // ─── PATCH /posts/:id ─────────────────────────────────────────
    fastify.patch<{ Params: { id: string }; Body: UpdatePostInput }>("/posts/:id", {
        schema: {
            tags: ["Posts"],
            summary: "Update post by ID (Owner only)",
            security: [{ bearerAuth: [] }],
            params: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid", description: "Post ID" },
                },
            },
            body: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Post title" },
                    content: { type: "string", description: "Post content" },
                },
            },
            response: {
                200: {
                    description: "Post updated successfully",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        data: { type: "object", properties: postResponseProperties },
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
                    description: "Unauthorized",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
                403: {
                    description: "Forbidden",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
                404: {
                    description: "Post not found",
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
        preHandler: [authenticate, authorizePostOwner],
    }, async (request, reply) => {
        const { id } = request.params;

        const result = updatePostSchema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send({
                success: false,
                errors: result.error.flatten().fieldErrors,
            });
        }

        try {
            const [updatedPost] = await db
                .update(posts)
                .set({ ...result.data, updatedAt: new Date() })
                .where(eq(posts.id, id))
                .returning();

            return reply.status(200).send({
                success: true,
                data: updatedPost,
            });
        } catch (err) {
            fastify.log.error(err);

            return reply.status(500).send({
                success: false,
                message: "Internal server error",
            });
        }
    });

    // ─── DELETE /posts/:id ────────────────────────────────────────
    fastify.delete<{ Params: { id: string } }>("/posts/:id", {
        schema: {
            tags: ["Posts"],
            summary: "Delete post by ID (Owner only)",
            security: [{ bearerAuth: [] }],
            params: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid", description: "Post ID" },
                },
            },
            response: {
                200: {
                    description: "Post deleted successfully",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
                401: {
                    description: "Unauthorized",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
                403: {
                    description: "Forbidden",
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                    },
                },
                404: {
                    description: "Post not found",
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
        preHandler: [authenticate, authorizePostOwner],
    }, async (request, reply) => {
        const { id } = request.params;

        try {
            const [deletedPost] = await db
                .delete(posts)
                .where(eq(posts.id, id))
                .returning({ id: posts.id });

            if (!deletedPost) {
                return reply.status(404).send({
                    success: false,
                    message: "Post not found",
                });
            }

            return reply.status(200).send({
                success: true,
                message: "Post deleted successfully",
            });
        } catch (err) {
            fastify.log.error(err);

            return reply.status(500).send({
                success: false,
                message: "Internal server error",
            });
        }
    });

}