import type { AppType } from '../index'
import { hc } from 'hono/client'

export const createClient = (token: string, origin: string = '/') => {
    return hc<AppType>(origin, {
        headers() {
            return {
                "Authorization": `Bearer ${token}`
            };
        }
    });
}