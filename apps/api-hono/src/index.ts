import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { luciaAuth } from './middlewares/lucia'
import { deleteExpiredOtps, HonoVariables, luciaInstance } from 'lib/auth/auth';
import { usersApp } from './usersApp';
import { migrateDb } from 'lib/db/migrate';
import { checkRequestOrigin } from './lib/checkRequestOrigin';
import db from 'lib/db/db';
import { authApp } from './authApp';

const app = new Hono<{ Variables: HonoVariables }>()
app.use(luciaAuth);
app.use(cors({
  // `c` is a `Context` object
  origin: (origin, c) => {
    return checkRequestOrigin(origin)
      ? origin
      : `https://${process.env.ORIGIN}`
  },
}))

// app.get('/', (c) => {
//   return c.text(`
    
//     session: 
//     ${JSON.stringify(c.get('session'), null, 2)}

//     user: 
//     ${JSON.stringify(c.get('user'), null, 2)}
    
//     `)
// })

const routes = app.basePath('/api')
  .route('/users', usersApp)
  .route('/auth', authApp)

export type AppType = typeof routes

const port = 3000
console.log(`hono api is running on port ${port}`);

async function main() {
  // console.log('Current directory:', process.cwd());
	await migrateDb(db, {
		migrationsFolder: '../../packages/lib/migrations',
	});
  
  serve({
    fetch: app.fetch,
    port
  }).once('listening', () => {
		console.log('🚀 Server started on port 3000');
  });

  afterStart();
}


main().catch((err) => {
	console.error(err);
	process.exit(1);
});

const afterStart = async () => { 
  await deleteExpiredOtps();
  await luciaInstance.deleteExpiredSessions();
  console.log('afterStart:FINISH Deleted expired otps and sessions');
}