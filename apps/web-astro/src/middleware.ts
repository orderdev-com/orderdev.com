// import { luciaInstance, verifyRequestOriginWrapper } from "auth-lucia/src/auth";
// import { luciaInstance } from "auth-lucia/src/auth";
import { defineMiddleware } from "astro:middleware";
import client from "./lib/apiClient";

export const onRequest = defineMiddleware(async (context, next) => {
	// 'security.checkOrigin' is ENABLED 
	// https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin
	// if (context.request.method !== "GET") {
	// 	const originHeader = context.request.headers.get("Origin");
	// 	const hostHeader = context.request.headers.get("Host");
	// 	if (!originHeader || !hostHeader || !verifyRequestOriginWrapper(originHeader, [hostHeader])) {
	// 		return new Response(null, {
	// 			status: 403
	// 		});
	// 	}
	// }

	// const sessionId = context.cookies.get(luciaInstance.sessionCookieName)?.value ?? null;
	// if (!sessionId) {
	// 	context.locals.user = null;
	// 	context.locals.session = null;
	// 	return next();
	// }

	// const { session, user } = await luciaInstance.validateSession(sessionId);
	// if (session && session.fresh) {
	// 	const sessionCookie = luciaInstance.createSessionCookie(session.id);
	// 	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	// }

	// if (!session) {
	// 	const sessionCookie = luciaInstance.createBlankSessionCookie();
	// 	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    // }
    
    const response = await fetch(`http://localhost:3000/api/auth/check-session`, {
        method: 'GET',
        headers: context.request.headers,
        // body: context.request.body,
        credentials: 'include',
        ...( { duplex: 'half' } as RequestInit ), // Add this line to resolve the error
    });
    const data = await response.json();

	context.locals.session = data.session;
	context.locals.user = data.user;
	return next();
});