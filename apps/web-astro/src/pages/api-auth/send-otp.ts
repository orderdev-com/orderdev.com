import type { APIRoute } from "astro";
import { sendOTP } from "lib/auth/auth";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString()!;
  await sendOTP(email);
  // return redirect(`/enter-otp?email=${email}`);
  return new Response("OTP sent", { status: 200 });
};
