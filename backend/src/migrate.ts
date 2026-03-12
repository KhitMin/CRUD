import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function waitForDb(pool: Pool, retries = 10, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log("✅ Database is ready");
      return;
    } catch {
      console.log(`⏳ Waiting for database... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("❌ Database not ready after retries");
}

async function runMigrations() {
  const pool = new Pool({
    connectionString:        process.env.DATABASE_URL,
    connectionTimeoutMillis: 3000,
  });

  await waitForDb(pool);

  const db = drizzle(pool);

  console.log("⏳ Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migrations complete");

  await pool.end();
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});