import { createApiClient } from "api-hono/src/lib/apiClient";

export const createApiForClient = function () {
    if (import.meta.env.SSR) { 
        throw new Error("This function should only be called on the client side");
    }
    return createApiClient(window.token, import.meta.env.PUBLIC_API_URL);
}