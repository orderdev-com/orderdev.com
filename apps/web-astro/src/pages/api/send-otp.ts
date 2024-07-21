import type { APIRoute } from "astro";
import db from "db-drizzle/src/db";
import { eq } from "drizzle-orm";
import { userTable } from "db-drizzle/src/schema";
import { createEmailOTP, generateIdFromEntropySizeWrapper } from "auth-lucia/src/auth";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString()!;

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
  console.log(email, code);
  return redirect(`/enter-otp?email=${email}`);
};
