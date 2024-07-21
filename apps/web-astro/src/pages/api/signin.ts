import type { APIRoute } from "astro";
import db  from "db-drizzle/src/db";
import { userTable } from "db-drizzle/src/schema";
import { eq } from "drizzle-orm";
import { createEmailVerificationToken } from "auth-lucia/src/auth";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString()!;
  const origin = request.headers.get("origin")!;

  const userArray = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email));
  const user = userArray[0];
  if (!user) return redirect("/error");

  const tokenId = await createEmailVerificationToken(user.id, email);
  const verificationLink = new URL(
    `/api/verifyToken?token=${tokenId}`,
    origin
  ).toString();

  // await sendEmail(email, verificationLink);
  console.log(email, verificationLink);
  return redirect("/");
};
