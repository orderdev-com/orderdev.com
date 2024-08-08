import { google, lucia } from "../../../lib/auth";
import { OAuth2RequestError } from "arctic";
import { db } from "../../../lib/db";
import { generateId } from "lucia";
import { parseJWT } from "oslo/jwt";


import type { APIContext } from "astro";
import type { DatabaseUser } from "../../../lib/db";

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("google_oauth_state")?.value ?? null;
	const storedCodeVerifier = context.cookies.get("google_oauth_code_verifier")?.value ?? null;
	// remove cookies
	context.cookies.delete("google_oauth_state");
	context.cookies.delete("google_oauth_code_verifier");

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const googleUserParsed = parseJWT(tokens.idToken)!.payload;
		console.log(`googleUserParsed✅✅✅✅: ${JSON.stringify(googleUserParsed, null, 2)}`);
		/*/
		scopes: ["profile", "email"]
		{
			"iss": "..",
			"azp": "..",
			"aud": "..",
			"sub": "..",
			"email": "..",
			"email_verified": true,
			"at_hash": "...",
			"nonce": ".._..",
			"name": "...",
			"picture": "..",
			"given_name": "...",
			"family_name": "...",
			"iat": 1723...,
			"exp": 1723...
		}
		/*/
		const googleUser: GoogleUser = await googleUserResponse.json();
		console.log(`googleUser✅✅✅✅: ${JSON.stringify(googleUser, null, 2)}`);
		/*/
		scopes: ["profile", "email"]
		{
			"sub": "...",
			"name": "...",
			"given_name": "...",
			"family_name": "...",
			"picture": "...",
			"email": "...",
			"email_verified": true
		}
		/*/
		const existingUser = db.prepare("SELECT * FROM user WHERE email = ?").get(googleUser.email) as
			| DatabaseUser
			| undefined;

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			return context.redirect("/");
		}

		const userId = generateId(15);
		db.prepare("INSERT INTO user (id, email) VALUES (?, ?)").run(
			userId,
			googleUser.email
		);
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return context.redirect("/");
	} catch (e) {
		if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GoogleUser {
	sub: string;
	picture: string;
	email: string;
	email_verified: boolean;
}
