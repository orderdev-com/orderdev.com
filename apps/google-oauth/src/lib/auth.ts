import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import { db } from "./db";
import { Google } from "arctic";

import type { DatabaseUser } from "./db";

const adapter = new BetterSqlite3Adapter(db, {
	user: "user",
	session: "session"
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: import.meta.env.PROD
		}
	},
	getUserAttributes: (attributes) => {
		return {
			email: attributes.email
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Omit<DatabaseUser, "id">;
	}
}

export const google = new Google(
	import.meta.env.OAUTH_GOOGLE_ID,
	import.meta.env.OAUTH_GOOGLE_SECRET,
	import.meta.env.OAUTH_GOOGLE_REDIRECT
);
