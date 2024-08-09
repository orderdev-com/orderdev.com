import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/*/ 
- please avoid adding foreign keys for now
/*/

const userTable = sqliteTable("user", {
    id: text("id").notNull().primaryKey(),
    email: text("email").notNull(),
    email_verified: integer("email_verified", { mode: 'boolean' }).default(false),
});

const sessionTable = sqliteTable("user_session", {
    id: text("id").notNull().primaryKey(),
    userId: text("user_id")
        .notNull(),
        // .references(() => userTable.id), // avoid adding foreign keys for now
    expiresAt: integer("expires_at").notNull(),
});

const otpTable = sqliteTable("user_otp", {
    id: text("id").notNull().primaryKey(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expires_at: integer("expires_at").notNull()
});

export { userTable, sessionTable, otpTable };
