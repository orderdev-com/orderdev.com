import { hc } from 'hono/client'
import type { AppType } from 'api-hono/src/index'
// import { cookies } from 'astro:cookies'

const client = hc<AppType>('/api/proxy/', {
    // headers() {
    //     let token: string | null | undefined = import.meta.env.SSR ? globalThis.jwtTokenValue : window.jwtTokenValue;
    //     return {
    //         "Authorization": `Bearer ${token}`
    //     };

    // },

});

export default client