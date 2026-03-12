import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db";
import { users } from "../schemas/user_schema";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate, authorizeAdmin, authorizeOwner } from "../middlewares/authenticate";

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().min(1, "Email cannot be empty").email("Invalid email format").optional(),
  phoneNo: z.string().optional(),
  description: z.string().optional(),
});

// type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ─── Response Properties (password မပါ) ───────────────────────
const userResponseProperties = {
  id: { type: "string", format: "uuid" },
  name: { type: "string" },
  email: { type: "string" },
  phoneNo: { type: "string" },
  description: { type: "string" },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
};

export async function userRoutes(fastify: FastifyInstance) {

  // ─── GET /users ───────────────────────────────────────────────
  fastify.get<{
    Querystring: { page?: number; limit?: number }
  }>("/users", {
    schema: {
      tags: ["Users"],
      summary: "Get all users (Admin only)",
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
          description: "List of users",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: { type: "object", properties: userResponseProperties },
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
    preHandler: [authenticate, authorizeAdmin],  // ← middleware chain
  }, async (request, reply) => {
    const { page, limit } = paginationSchema.parse(request.query);  // ← ထည့်
    const offset = (page - 1) * limit;
    try {
      const [allUsers, total] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phoneNo: users.phoneNo,
            description: users.description,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users),
      ]);

      return reply.status(200).send({
        success: true,
        data: allUsers,
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

  // ─── GET /users/:id ───────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>("/users/:id", {
    schema: {
      tags: ["Users"],
      summary: "Get user by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "User ID" },
        },
      },
      response: {
        200: {
          description: "User found",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", properties: userResponseProperties },
          },
        },
        404: {
          description: "User not found",
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
    preHandler: [authenticate, authorizeOwner],  // ← middleware chain
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNo: users.phoneNo,
          description: users.description,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      return reply.status(200).send({
        success: true,
        data: user,
      });
    } catch (err) {
      fastify.log.error(err);

      return reply.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // ─── PATCH /users/:id ─────────────────────────────────────────
  fastify.patch<{ Params: { id: string }; Body: UpdateUserInput }>("/users/:id", {
    schema: {
      tags: ["Users"],
      summary: "Update user by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "User ID" },
        },
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string", description: "User's full name" },
          email: { type: "string", description: "User's email" },
          phoneNo: { type: "string", description: "Phone number" },
          description: { type: "string", description: "About the user" },
        },
      },
      response: {
        200: {
          description: "User updated successfully",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", properties: userResponseProperties },
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
        404: {
          description: "User not found",
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
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
    }, preHandler: [authenticate, authorizeOwner],  // ← middleware chain
  }, async (request, reply) => {
    const { id } = request.params;

    const result = updateUserSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        errors: result.error.flatten().fieldErrors,
      });
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNo: users.phoneNo,
          description: users.description,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      if (!updatedUser) {
        return reply.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      return reply.status(200).send({
        success: true,
        data: updatedUser,
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

  // ─── DELETE /users/:id ────────────────────────────────────────
  fastify.delete<{ Params: { id: string } }>("/users/:id", {
    schema: {
      tags: ["Users"],
      summary: "Delete user by ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "User ID" },
        },
      },
      response: {
        200: {
          description: "User deleted successfully",
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
          },
        },
        404: {
          description: "User not found",
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
    }, preHandler: [authenticate, authorizeOwner],  // ← middleware chain
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (!deletedUser) {
        return reply.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      return reply.status(200).send({
        success: true,
        message: "User deleted successfully",
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