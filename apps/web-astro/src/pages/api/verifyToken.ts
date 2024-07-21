import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import db  from "db-drizzle/src/db";
import { userTable, emailVerificationTokenTable } from "db-drizzle/src/schema";
import { luciaInstance } from "auth-lucia/src/auth";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token = url.searchParams.get("token")!;
  if (!token) return redirect("/error");

  const tokenDataArray = await db
    .select()
    .from(emailVerificationTokenTable)
    .where(eq(emailVerificationTokenTable.id, token));

  const tokenData = tokenDataArray[0];

  // Check if the token is valid and has not expired
  if (!tokenData || new Date() > new Date(tokenData.expires_at)) {
    return redirect("/error");
  }

  const userArray = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, tokenData.user_id));
  const user = userArray[0];

  if (!user) {
    return redirect("/error");
  }

  if (!user.email_verified) {
    await db
      .update(userTable)
      .set({
        email_verified: true,
      })
      .where(eq(userTable.id, tokenData.user_id));
  }

  await luciaInstance.invalidateUserSessions(tokenData.user_id);

  const session = await luciaInstance.createSession(tokenData.user_id, {});
  const sessionCookie = luciaInstance.createSessionCookie(session.id);
  cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  await db
    .delete(emailVerificationTokenTable)
    .where(eq(emailVerificationTokenTable.id, token));

  return redirect("/", 303);
};
