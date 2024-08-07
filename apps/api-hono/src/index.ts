import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { luciaAuth } from './middlewares/lucia'
import { deleteExpiredOtps, HonoVariables, luciaInstance } from 'lib/auth/auth';

const app = new Hono<{ Variables: HonoVariables }>()
app.use(luciaAuth);

app.get('/', (c) => {
  return c.text(`
    
    session: 
    ${JSON.stringify(c.get('session'), null, 2)}

    user: 
    ${JSON.stringify(c.get('user'), null, 2)}
    
    `)
})

const port = 3000
console.log(`hono api is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})

const cron = async () => { 
  await deleteExpiredOtps();
  await luciaInstance.deleteExpiredSessions();
}