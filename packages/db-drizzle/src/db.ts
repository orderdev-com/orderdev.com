import { config } from 'dotenv';
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";

config({ path: '.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

export default db;


