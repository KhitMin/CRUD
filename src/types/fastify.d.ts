import type { JwtPayload } from "../middlewares/authenticate";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}