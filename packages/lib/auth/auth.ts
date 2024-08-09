import { Lucia, verifyRequestOrigin as verifyRequestOrigin_ORIGINAL } from "lucia";
import { generateIdFromEntropySize } from "lucia";
import { Google, OAuth2RequestError } from "arctic";
import { TimeSpan, createDate } from "oslo";
import { parseJWT } from "oslo/jwt";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { and, eq, lt } from "drizzle-orm";
import { otpTable, sessionTable, userTable } from "../db/schema";
import { sendUserOtpEmail } from "../email/sendUserOtp";
import { isProd } from "../utils/isProd";
import { generateCodeVerifier, generateState } from "arctic";
import db from "../db/db";

export const verifyRequestOrigin = verifyRequestOrigin_ORIGINAL;
export const generateIdFromEntropySizeWrapper = generateIdFromEntropySize;

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

const google = new Google(
	process.env.OAUTH_GOOGLE_ID!,
	process.env.OAUTH_GOOGLE_SECRET!,
	process.env.OAUTH_GOOGLE_REDIRECT!
);

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

export const luciaInstance = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      // set to `true` when using HTTPS
      // secure: isProd,
      secure: true, // make it always secure, dev mode also uses HTTPS
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
    };
  }
});

export const validateGoogleCallback = async (
  code: string,
  storedCodeVerifier: string
) => { 
  try {
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const googleUserParsed = parseJWT(tokens.idToken)!.payload;
		console.log(`googleUserParsed✅✅✅✅: ${JSON.stringify(googleUserParsed, null, 2)}`);
		/*/
		scopes: ["profile", "email"]
		{
			"iss": "..",
			"azp": "..",
			"aud": "..",
			"sub": "..",
			"email": "..",
			"email_verified": true,
			"at_hash": "...",
			"nonce": ".._..",
			"name": "...",
			"picture": "..",
			"given_name": "...",
			"family_name": "...",
			"iat": 1723...,
			"exp": 1723...
		}
		/*/
    interface GoogleUser {
      sub: string;
      picture: string;
      email: string;
      email_verified: boolean;
    }
		const googleUser: GoogleUser = await googleUserResponse.json();
    console.log(`googleUser✅✅✅✅: ${JSON.stringify(googleUser, null, 2)}`);
    const user = await upsertUser(googleUser.email);
    await db
      .update(userTable)
      .set({
        email_verified: googleUser.email_verified,
      })
      .where(eq(userTable.id, user.id));

    // const session = await luciaInstance.createSession(user.id, {});
    // const sessionCookie = luciaInstance.createSessionCookie(session.id);
    return await luciaInstance.createSession(user.id, {});
  } catch (e) {
    console.error(`validateGoogleCallback❌❌❌❌:`);
    console.error(e);
		if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
			// invalid code
			throw new Error("Invalid code");
		}
		throw e;
	}
}
export const getGoogleSignInURL = async () => { 
  const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = await google.createAuthorizationURL(state, codeVerifier, {
		scopes: ["profile", "email"]
	});
  return { url, state, codeVerifier };
}

export const createEmailOTP = async (
  email: string
) => {
  await db
    .delete(otpTable)
    .where(eq(otpTable.email, email));

  const otpId = generateIdFromEntropySize(25); // 40 characters long
  const code = generateCode();

  await db.insert(otpTable).values({
    id: otpId,
    code,
    email,
    expires_at: createDate(new TimeSpan(10, "m")).getTime()
  });
  return code;
};

const upsertUser = async (email: string) => { 
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
  return existingUser;
}

export const sendOTP = async (email: string) => {
  const code = await createEmailOTP(email);
  await sendUserOtpEmail(email, code);
  return code;
};

export const deleteExpiredOtps = async function () {
  const result = await db
    .delete(otpTable)
    .where(lt(otpTable.expires_at, new Date().getTime()));
    console.log(`Deleted expired OTPs result.rowsAffected: ${result.rowsAffected}`);
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

  // const userArray = await db
  //   .select()
  //   .from(userTable)
  //   .where(eq(userTable.id, otpData.user_id));
  // const user = userArray[0];

  // if (!user) {
  //   throw new Error("User not found");
  // }
  const user = await upsertUser(email);

  if (!user.email_verified) {
    await db
      .update(userTable)
      .set({
        email_verified: true,
      })
      .where(eq(userTable.id, user.id));
  }

  // do we need to invalidate all user sessions here?
  // await luciaInstance.invalidateUserSessions(otpData.user_id);
  const session = await luciaInstance.createSession(user.id, {});
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