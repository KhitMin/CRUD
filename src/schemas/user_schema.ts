import { pgTable, uuid, varchar, text, timestamp, pgEnum, index} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const users = pgTable("users", {
  id:          uuid("id").defaultRandom().primaryKey(),
  name:        varchar("name", { length: 100 }).notNull(),
  email:       varchar("email", { length: 255 }).notNull().unique(),
  password:    varchar("password", { length: 255 }).notNull(),
  role:        userRoleEnum("role").default("user").notNull(),
  phoneNo:     varchar("phone_no", { length: 20 }),
  description: text("description"),
  createdAt:   timestamp("created_at").defaultNow(),
  updatedAt:   timestamp("updated_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_users_created_at").on(table.createdAt),
}));