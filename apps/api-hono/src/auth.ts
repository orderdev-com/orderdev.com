import { Hono } from 'hono'
import {
    setCookie
} from 'hono/cookie'
import { zValidator } from '@hono/zod-validator'
import { userTable, otpTable } from "./schema";
import { createEmailOTP, generateIdFromEntropySizeWrapper } from "./lib/auth";
import { eq, and } from "drizzle-orm";
import { z } from 'zod'
import db from './db'

import { luciaInstance } from "./lib/auth";

type Variables = {
    session: import("lucia").Session | null,
    user: import("lucia").User | null
}

export const authApp = new Hono<{ Variables: Variables }>()
    .get(
        '/check-session',
        async (c) => {
            return c.json({
                user: c.get('user'),
                session: c.get('session')
            }, 201)
        }
    )
    .post(
        '/sendOtp',
        zValidator(
            'form',
            z.object({
                email: z.string().email(),
            })
        ),
        async (c) => {
            const validated = c.req.valid('form')
            // ... use your validated data
            const email = validated.email;
            const existingUserArray = await db
                .select()
                .from(userTable)
                .where(eq(userTable.email, email));
            let existingUser = existingUserArray[0];

            if (!existingUser) {
                const userId = generateIdFromEntropySizeWrapper(10);
                existingUser = {
                    id: userId,
                    email: email,
                    email_verified: false,
                }
                await db.insert(userTable).values(existingUser);
            }

            const code = await createEmailOTP(existingUser.id, email);
            console.log(email, code);
            return c.json(
                {
                    email
                },
                201
            )
        }
    )
    .post(
        '/verify-otp',
        zValidator(
            'form',
            z.object({
                email: z.string().email(),
                code: z.string().min(6).max(6)
            })
        ),
        async (c) => {
            const validated = c.req.valid('form')
            // ... use your validated data
            const email = validated.email;
            const code = validated.code.toUpperCase();

            console.log(email, code)

            const otpDataArray = await db
                .select()
                .from(otpTable)
                .where(
                    and(
                        eq(otpTable.code, code),
                        eq(otpTable.email, email)
                    )
                );

            const otpData = otpDataArray[0];

            if (!otpData) {
                return c.json({ error: 'otp not found' }, 503)
            }
            if (new Date() > new Date(otpData.expires_at)) {
                await db
                    .delete(otpTable)
                    .where(eq(otpTable.id, otpData.id));
                return c.json({ error: 'expired' }, 503)
            }

            const userArray = await db
                .select()
                .from(userTable)
                .where(eq(userTable.id, otpData.user_id));
            const user = userArray[0];

            if (!user) {
                return c.json({ error: 'user_not_found' }, 503)
            }

            if (!user.email_verified) {
                await db
                    .update(userTable)
                    .set({
                        email_verified: true,
                    })
                    .where(eq(userTable.id, otpData.user_id));
            }

            await luciaInstance.invalidateUserSessions(otpData.user_id);

            const session = await luciaInstance.createSession(otpData.user_id, {});
            const sessionCookie = luciaInstance.createSessionCookie(session.id);

            if (sessionCookie.attributes.maxAge! > 3456e4) {
                sessionCookie.attributes.maxAge = 3456e4;
            }
            console.log('sessionCookie.attributes', sessionCookie.attributes)
            setCookie(c, sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

            // cookies.set( //Astro.cookies
            //     sessionCookie.name,
            //     sessionCookie.value,
            //     sessionCookie.attributes
            // );

            await db
                .delete(otpTable)
                .where(eq(otpTable.id, otpData.id));


            return c.json(
                {
                    email
                },
                201
            )
        }
    )
    .post(
        '/logout',
        // zValidator(
        //     'form',
        //     z.object({})
        // ),
        async (c) => {
            const session = c.get('session');

            if (session) {
                await luciaInstance.invalidateSession(session.id);
                const sessionCookie = luciaInstance.createBlankSessionCookie();

                setCookie(c,
                    sessionCookie.name,
                    sessionCookie.value,
                    sessionCookie.attributes
                );
            }

            return c.json(
                {
                    status: 'done'
                },
                201
            )
        }
    )