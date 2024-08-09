import { luciaInstance, verifyRequestOrigin } from "lib/auth/auth";
import { defineMiddleware } from "astro:middleware";

export const sessionIdMiddleware = defineMiddleware(async (context, next) => { 
	const refererSessionId = context.url.searchParams.get("referer_session_id");
	if (refererSessionId) {
		const sessionCookie = luciaInstance.createSessionCookie(refererSessionId);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		// redirect to the same URL without the referer_session_id
		const url = new URL(context.url.toString());
		url.searchParams.delete("referer_session_id");
		return context.redirect(url.toString());
	}
	return next();
});