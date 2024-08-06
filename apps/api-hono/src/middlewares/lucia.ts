import { createMiddleware } from 'hono/factory'
import { luciaInstance } from "../lib/auth";
import {
    getCookie,
    setCookie
  } from 'hono/cookie'

export const luciaAuth = createMiddleware(async (c, next) => {

    // const authorizationHeader = c.req.query('auth') || c.req.header('Authorization') || c.req.header('authorization') || null;
    // const sessionId = luciaInstance.readBearerToken(`Bearer ${authorizationHeader ?? ""}`);
    // if (!sessionId) {
    //     c.set('session', null);
    //     c.set('user', null);
    // } else {
    //     const { session, user } = await luciaInstance.validateSession(sessionId);
    //     c.set('session', session);
    //     c.set('user', user);
    // }

    const sessionIdWithCookie = getCookie(c, luciaInstance.sessionCookieName)?? null;
	if (!sessionIdWithCookie) {
		c.set('session', null);
        c.set('user', null);
    } else {
        const { session, user } = await luciaInstance.validateSession(sessionIdWithCookie);
        if (session && session.fresh) {
            const sessionCookie = luciaInstance.createSessionCookie(session.id);
            setCookie(c, sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
        }
        if (!session) {
            const sessionCookie = luciaInstance.createBlankSessionCookie();
            setCookie(c, sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
        }
        c.set('session', session);
        c.set('user', user);
    }
    
    await next()
})