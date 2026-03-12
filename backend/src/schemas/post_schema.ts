import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./user_schema";

export const posts = pgTable("posts", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  title:     varchar("title", { length: 255 }).notNull(),
  content:   text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx:    index("idx_posts_user_id").on(table.userId),
  createdAtIdx: index("idx_posts_created_at").on(table.createdAt),
}));