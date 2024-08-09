import { Hono } from 'hono'
import { HonoVariables, validateGoogleCallback } from 'lib/auth/auth'
import { getGoogleSignInURL } from "lib/auth/auth";
import {
    deleteCookie,
    getCookie,
    setCookie
} from 'hono/cookie'
import { isProd } from 'lib/utils/isProd';
import { checkRequestOrigin } from './lib/checkRequestOrigin';


export const authApp = new Hono<{ Variables: HonoVariables }>()
    .get(
        '/google-login',
        async (c) => {
            const { url, state, codeVerifier } = await getGoogleSignInURL()
            const redirect = decodeURIComponent(c.req.query("redirect") || "") ?? null;
            const referer = c.req.header("referer");
            // check redirect is starting with referer origin
            if (redirect && referer && !redirect.startsWith(referer)) {
                console.log(`Invalid redirect: ${redirect}`);
                return c.body("invalid-redirect", 400);
            }
            console.log("referer", redirect);
            if (!referer) {
                throw new Error("missing referer");
            }
            // check origin before redirecting with checkRequestOrigin(origin)
            if (!(await checkRequestOrigin(new URL(referer).origin))) {
                console.log(`Invalid origin: ${referer}`);
                return c.body("unknown-site", 400);
            }

            setCookie(c, "redirect_url", redirect, {
                path: "/",
                secure: isProd,
                httpOnly: true,
                maxAge: 60 * 10,
                sameSite: "Lax"
            });

            setCookie(c, "google_oauth_state", state, {
                path: "/",
                secure: isProd,
                httpOnly: true,
                maxAge: 60 * 10,
                sameSite: "Lax"
            });

            setCookie(c, "google_oauth_code_verifier", codeVerifier, {
                path: "/",
                secure: isProd,
                httpOnly: true,
                maxAge: 60 * 10,
                sameSite: "Lax"
            });

            return c.redirect(url.toString());
            // return c.json(
            //     {
            //         h: c.req.header(),
            //         url: url.toString(),
            //     }, 200);
        }
    )
    .get("/google-callback", async (c) => {
        const code = c.req.query("code")?.toString() ?? null;
        const state = c.req.query("state")?.toString() ?? null;

        const storedState = getCookie(c).google_oauth_state ?? null;
        const storedCodeVerifier = getCookie(c).google_oauth_code_verifier ?? null;
        const storedRedirectUrl = getCookie(c).redirect_url ?? null;

        deleteCookie(c, "google_oauth_state");
        deleteCookie(c, "google_oauth_code_verifier");
        deleteCookie(c, "redirect_url");

        if (!code || !state || !storedState || !storedCodeVerifier || !storedRedirectUrl || state !== storedState) {
            return c.body(`expired or missing data, please go back multiple times to find your website`, 400);
        }
        try {
            const session = await validateGoogleCallback(code, storedCodeVerifier);
            const referer = new URL(storedRedirectUrl);
            // check origin before redirecting with checkRequestOrigin(origin)
            if (!(await checkRequestOrigin(referer.origin))) {
                console.log(`Invalid origin: ${referer.origin}`);
                return c.body("unknown-site", 400);
            }
            referer.searchParams.delete("referer_session_id");
            referer.searchParams.set("referer_session_id", session.id);
            console.log("referer URL before redirect", referer.toString());
            return c.redirect(referer.toString());
        } catch (e) {
            console.error(e);
            // return c.body(null, 400);
            return c.body("invalid-error", 400);
        }
    })