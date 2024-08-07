import { Lucia, verifyRequestOrigin as verifyRequestOrigin_ORIGINAL } from "lucia";
import { generateIdFromEntropySize } from "lucia";
import { TimeSpan, createDate } from "oslo";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { and, eq, lt } from "drizzle-orm";
import { otpTable, sessionTable, userTable } from "../db/schema";
import { sendUserOtpEmail } from "../email/sendUserOtp";
import { isProd } from "../utils/isProd";
import db from "../db/db";

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
      secure: isProd,
    },
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof luciaInstance;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

type DatabaseUserAttributes = {
  email: string;
};



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

export const verifyRequestOrigin = verifyRequestOrigin_ORIGINAL;
export const generateIdFromEntropySizeWrapper = generateIdFromEntropySize;

export const sendOTP = async (email: string) => {
  const existingUserArray = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email));
  let existingUser = existingUserArray[0];

  if (!existingUser) {
    const userId = generateIdFromEntropySizeWrapper(10);
    existingUser = {
      id: userId,
      email: email,
      email_verified: false,
    }
    await db.insert(userTable).values(existingUser);
  }
  const code = await createEmailOTP(existingUser.id, email);
  await sendUserOtpEmail(email, code);
  return code;
};

export const deleteExpiredOtps = async function () {
  const result = await db
    .delete(otpTable)
    .where(lt(otpTable.expires_at, new Date().getTime()));
    console.log(`Deleted expired OTPs result.rowsAffected: ${result.rowsAffected}`);
  //result.rowsAffected
}

export const verifyOTP = async function (email: string, code: string) {
  const otpDataArray = await db
    .select()
    .from(otpTable)
    .where(
      and(
        eq(otpTable.code, code),
        eq(otpTable.email, email)
      )
    );

  const otpData = otpDataArray[0];

  if (!otpData) {
    throw new Error("Invalid OTP");
  }
  if (new Date() > new Date(otpData.expires_at)) {
    await db
      .delete(otpTable)
      .where(eq(otpTable.id, otpData.id));
    throw new Error("OTP expired");
  }

  const userArray = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, otpData.user_id));
  const user = userArray[0];

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.email_verified) {
    await db
      .update(userTable)
      .set({
        email_verified: true,
      })
      .where(eq(userTable.id, otpData.user_id));
  }

  // do we need to invalidate all user sessions here?
  // await luciaInstance.invalidateUserSessions(otpData.user_id);

  const session = await luciaInstance.createSession(otpData.user_id, {});
  const sessionCookie = luciaInstance.createSessionCookie(session.id);
  await db
    .delete(otpTable)
    .where(eq(otpTable.id, otpData.id));

  return sessionCookie;
}

export type HonoVariables = {
  session: import("lucia").Session | null,
  user: import("lucia").User | null
}