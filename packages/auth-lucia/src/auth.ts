import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { otpTable, sessionTable, userTable } from "db-drizzle/src/schema";
import { generateIdFromEntropySize } from "lucia";
import { TimeSpan, createDate } from "oslo";
import { verifyRequestOrigin } from "lucia";
import { eq } from "drizzle-orm";
import db from "db-drizzle/src/db";

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

export const luciaInstance = new Lucia(adapter, {
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


const generateCode = () => {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code.toUpperCase();
}

export const createEmailOTP = async (
  userId: string,
  email: string
) => {
  await db
    .delete(otpTable)
    .where(eq(otpTable.user_id, userId));
  
  const otpId = generateIdFromEntropySize(25); // 40 characters long
  const code = generateCode();

  await db.insert(otpTable).values({
    id: otpId,
    user_id: userId,
    code,
    email,
    expires_at: createDate(new TimeSpan(10, "m")).getTime()
  });
  return code;
};

export const verifyRequestOriginWrapper = verifyRequestOrigin;
export const generateIdFromEntropySizeWrapper = generateIdFromEntropySize;

declare module "lucia" {
  interface Register {
    Lucia: typeof luciaInstance;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

type DatabaseUserAttributes = {
  email: string;
};