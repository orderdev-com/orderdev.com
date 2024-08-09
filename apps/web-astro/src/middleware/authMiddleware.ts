// import { luciaInstance, verifyRequestOriginWrapper } from "auth-lucia/src/auth";
import { luciaInstance, verifyRequestOrigin } from "lib/auth/auth";
import { defineMiddleware } from "astro:middleware";

export const sessionIdMiddleware = defineMiddleware(async (context, next) => { 
	const refererSessionId = context.url.searchParams.get("referer_session_id");
	console.log("refererSessionId", refererSessionId);
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

export const authMiddleware = defineMiddleware(async (context, next) => {
	// 'security.checkOrigin' is ENABLED 
	// https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin
	// no need to double check the origin
	if (context.request.method !== "GET") {
		const originHeader = context.request.headers.get("Origin");
		const hostHeader = context.request.headers.get("Host");
		if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
			return new Response(null, {
				status: 403
			});
		}
	}

	const sessionId = context.cookies.get(luciaInstance.sessionCookieName)?.value ?? null;
	if (!sessionId) {
		context.locals.user = null;
		context.locals.session = null;
		return next();
	}

	const { session, user } = await luciaInstance.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = luciaInstance.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}

	if (!session) {
		const sessionCookie = luciaInstance.createBlankSessionCookie();
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	}

	context.locals.session = session;
	context.locals.user = user;
	return next();
});