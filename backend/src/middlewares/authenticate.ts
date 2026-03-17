import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { posts } from "../schemas/post_schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

export interface JwtPayload {
  id:    string;
  email: string;
  role:  "admin" | "user";
}

// Token verify လုပ်တယ်
export async function authenticate(
  request: FastifyRequest,
  reply:   FastifyReply
) {
  const authHeader = request.headers.authorization;

  request.log.info({ authHeader }, "Checking Auth Header");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({
      success: false,
      message: "Missing or invalid authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
    request.user  = decoded;
  } catch (err: any) {
    request.log.error({ err }, "JWT Verify Error");
    return reply.status(401).send({
      success: false,
      message: "Invalid or expired token",
      error_detail: err.message,
    });
  }
}

// Admin role စစ်တယ်
export async function authorizeAdmin(
  request: FastifyRequest,
  reply:   FastifyReply
) {
  if (request.user?.role !== "admin") {
    return reply.status(403).send({
      success: false,
      message: "Forbidden: admin access required",
    });
  }
}

export async function authorizeOwner(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply:   FastifyReply
) {
  const user = request.user;
  const { id } = request.params;

  if (!user) {
    return reply.status(401).send({
      success: false,
      message: "Unauthorized",
    });
  }

  if (user.id !== id) {
    return reply.status(403).send({
      success: false,
      message: "Forbidden: you can only access your own data",
    });
  }
}

export async function authorizePostOwner(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply:   FastifyReply
) {
  const user = request.user;
  const { id } = request.params;

  if (!user) {
    return reply.status(401).send({
      success: false,
      message: "Unauthorized",
    });
  }

  // Post ကို DB မှာ ရှာတယ်
  const [post] = await db
    .select({ userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, id));

  if (!post) {
    return reply.status(404).send({
      success: false,
      message: "Post not found",
    });
  }

  // Post ရဲ့ userId နဲ့ token ထဲက id နှိုင်းယှဉ်တယ်
  if (post.userId !== user.id) {
    return reply.status(403).send({
      success: false,
      message: "Forbidden: you can only modify your own posts",
    });
  }
}