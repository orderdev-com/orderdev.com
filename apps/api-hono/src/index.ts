import { migrate } from 'drizzle-orm/libsql/migrator';
import db from './db';
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { luciaAuth } from './middlewares/lucia'
import { authApp } from './auth';

type Variables = {
  session: import("lucia").Session | null,
  user: import("lucia").User | null
}

const app = new Hono<{ Variables: Variables }>()
app.use(luciaAuth);

app.get('/', (c) => {
  return c.text(`
    
    session: 
    ${JSON.stringify(c.get('session'), null, 2)}


    user: 
    ${JSON.stringify(c.get('user'), null, 2)}
    
    `)
})

const routes = app.basePath('/api')
  .route('/auth', authApp)

export type AppType = typeof routes

const port = 3000
console.log(`hono api is running on port ${port}`)

async function main() {
	await migrate(db, {
		migrationsFolder: './migrations',
  });

  serve({
    fetch: app.fetch,
    port
  })
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
