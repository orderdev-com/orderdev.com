// api/logout.ts
import type { APIRoute } from "astro";
import type { APIContext } from "astro";
import { luciaInstance } from "lib/auth/auth";

export const POST: APIRoute = async ({
  locals,
  cookies,
  request,
}: APIContext) => {
  const session = locals.session;
  const origin = request.headers.get("origin")!;

  if (session) {
    await luciaInstance.invalidateSession(session.id);
    const sessionCookie = luciaInstance.createBlankSessionCookie();

    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  }

  // return redirect(origin, 303);
  return new Response(null, {
    status: 303,
    headers: {
      Location: origin,
    },
  });
};
