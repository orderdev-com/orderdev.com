import { createMiddleware } from 'hono/factory'
import { luciaInstance } from "lib/auth/auth";
import { isProd } from 'lib/utils/isProd';

export const luciaAuth = createMiddleware(async (c, next) => {
    const authorizationHeader = isProd ?
        c.req.header('Authorization') || c.req.header('authorization') || null :
        c.req.query('auth') || c.req.header('Authorization') || c.req.header('authorization') || null;
    const sessionId = luciaInstance.readBearerToken(`${authorizationHeader ?? ""}`);
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