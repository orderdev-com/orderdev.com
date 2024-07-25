import { createMiddleware } from 'hono/factory'
import { luciaInstance } from "auth-lucia/src/auth";

export const luciaAuth = createMiddleware(async (c, next) => {
    const authorizationHeader = c.req.query('auth') || c.req.header('Authorization') || c.req.header('authorization') || null;
    const sessionId = luciaInstance.readBearerToken(`Bearer ${authorizationHeader ?? ""}`);
    if (!sessionId) {
        c.set('session', null);
        c.set('user', null);
    } else {
        const { session, user } = await luciaInstance.validateSession(sessionId);
        c.set('session', session);
        c.set('user', user);
    }
    await next()
})