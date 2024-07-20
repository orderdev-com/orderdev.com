import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { emailVerificationTokenTable, sessionTable, userTable } from "db-drizzle/src/schema";
import { generateIdFromEntropySize } from "lucia";
import { TimeSpan, createDate } from "oslo";
import { eq } from "drizzle-orm";
import db from "db-drizzle/src/db";

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
    };
  },
  sessionCookie: {
    expires: false,
    attributes: {
      // set to `true` when using HTTPS
      // secure: import.meta.env.PROD,
      secure: true,
    },
  },
});

export const createEmailVerificationToken = async (
  userId: string,
  email: string
) => {
  await db
    .delete(emailVerificationTokenTable)
    .where(eq(emailVerificationTokenTable.user_id, userId));
  const tokenId = generateIdFromEntropySize(25); // 40 characters long
  await db.insert(emailVerificationTokenTable).values({
    id: tokenId,
    user_id: userId,
    email,
    expires_at: createDate(new TimeSpan(2, "h")).getTime(),
  });
  return tokenId;
};


declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

type DatabaseUserAttributes = {
  email: string;
};