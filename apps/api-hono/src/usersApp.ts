import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HonoVariables } from 'lib/auth/auth'

// User schema
const UserSchema = z.object({
    id: z
        .string()
        .min(3),
    name: z.string(),
    email: z.string().email(),
})

type User = z.infer<typeof UserSchema>

// In-memory users array
let users: User[] = [
    { id: "1001", name: 'John Doe', email: 'john@example.com' },
    { id: "1002", name: 'Jane Doe', email: 'jane@example.com' },
]

export const usersApp = new Hono<{ Variables: HonoVariables }>()
    .get(
        '/whoami',
        (c) => {
            return c.json({
                user: c.get('user'),
                session: c.get('session'),
            }, 200)
        }
    )
    .get(
        '/',
        (c) => {
            return c.json(users, 200)
        }
    )
    .get(
        ':id',
        zValidator('param', z.object({ id: UserSchema.shape.id })),
        (c) => {
            const { id } = c.req.valid('param')
            const user = users.find(u => u.id === id)
            if (!user) {
                return c.json({ error: 'User not found' }, 404)
            }
            return c.json(user, 200)
        }
    )
    .post(
        '/',
        zValidator('json', UserSchema),
        (c) => {
            const user = c.req.valid('json')
            const index = users.findIndex(u => u.id === user.id)
            if (index === -1) {
                users.push(user)
            } else {
                return c.json({ error: 'User already exists' }, 400)
            }
            return c.json(user, 201)
        }
    )
    .put(
        '/:id',
        zValidator('param', z.object({ id: UserSchema.shape.id })),
        zValidator('json', UserSchema),
        (c) => {
            const { id } = c.req.valid('param')
            const user = c.req.valid('json')
            const index = users.findIndex(u => u.id === id)
            if (index === -1) {
                return c.json({ error: 'User not found' }, 404)
            }
            users[index] = user
            return c.json(user, 200)
        }
    )
    .delete(
        '/:id',
        zValidator('param', z.object({ id: UserSchema.shape.id })),
        (c) => {
            const { id } = c.req.valid('param')
            const index = users.findIndex(u => u.id === id)
            if (index === -1) {
                return c.json({ error: 'User not found' }, 404)
            }
            const user = users.splice(index, 1)[0]
            return c.json(user, 200)
        }
    );
