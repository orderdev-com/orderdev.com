import type { APIRoute } from "astro";
import { luciaInstance } from "auth-lucia/src/auth";
import db from "db-drizzle/src/db";
import { otpTable, userTable } from "db-drizzle/src/schema";
import { and, eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString()!;
    const code = formData.get("code")?.toString().toUpperCase()!;

    console.log(email, code)

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
        return redirect(`/error?msg=otp_not_found`);
    }
    if (new Date() > new Date(otpData.expires_at)) {
        await db
            .delete(otpTable)
            .where(eq(otpTable.id, otpData.id));
        return redirect(`/error?msg=expired`);
    }

    const userArray = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, otpData.user_id));
    const user = userArray[0];

    if (!user) {
        return redirect(`/error?msg=user_not_found`);
    }

    if (!user.email_verified) {
        await db
            .update(userTable)
            .set({
                email_verified: true,
            })
            .where(eq(userTable.id, otpData.user_id));
    }

    await luciaInstance.invalidateUserSessions(otpData.user_id);

    const session = await luciaInstance.createSession(otpData.user_id, {});
    const sessionCookie = luciaInstance.createSessionCookie(session.id);
    cookies.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
    );

    await db
        .delete(otpTable)
        .where(eq(otpTable.id, otpData.id));

    return redirect("/", 303);

}