import type { APIRoute } from "astro";
import { verifyOTP } from "lib/auth/auth";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString()!;
    const code = formData.get("code")?.toString().toUpperCase()!;

    console.log(email, code)
    try {
        const sessionCookie = await verifyOTP(email, code);
        cookies.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
        );
    } catch (e) { 
        return redirect(`/error?msg=${(e as Error).message}`);
    }

    return redirect("/", 303);

}