import type { APIRoute } from "astro";
import { sendOTP } from "lib/auth/auth";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString()!;
  await sendOTP(email);
  return redirect(`/enter-otp?email=${email}`);
};
