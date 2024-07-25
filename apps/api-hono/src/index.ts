import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { luciaAuth } from './middlewares/lucia'

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

const port = 3000
console.log(`hono api is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
