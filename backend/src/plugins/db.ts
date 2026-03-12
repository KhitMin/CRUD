import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { checkDbConnection } from "../db";

export default fp(async (fastify: FastifyInstance) => {
  try {
    await checkDbConnection();
    fastify.log.info("Database plugin registered");
  } catch (err) {
    fastify.log.error("Failed to initialize database plugin");
    throw err; // Fastify ကို error ပြန်ပို့ပြီး server မဖွင့်အောင်
  }
});