import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as users from "./schemas/user_schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 3000,  // ← 3 seconds မှာ timeout ဖြစ်မယ်
  idleTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema: { users } });

export async function checkDbConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();  // ← query fail ဖြစ်ရင် ဒီနေရာ မရောက်ဘူး → leak
  } catch (err) {
    throw new Error(`Database connection failed: ${err}`);
  }
}