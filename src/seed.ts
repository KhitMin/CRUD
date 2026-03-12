import "dotenv/config";
import { db } from "./db";
import { users } from "./schemas/user_schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("❌ ADMIN_EMAIL or ADMIN_PASSWORD is not set in .env");
    process.exit(1);
  }

  // ရှိပြီးသား admin စစ်တယ်
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail));

  if (existing) {
    console.log("✅ Admin already exists, skipping...");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await db.insert(users).values({
    name:     "Admin",
    email:    adminEmail,
    password: hashedPassword,
    role:     "admin",
  });

  console.log("✅ Admin user created successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});