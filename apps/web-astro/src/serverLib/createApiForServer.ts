import { createApiClient } from "api-hono/src/lib/apiClient";

export const createApiForServer = function (sessionId: string) {
    if (!import.meta.env.SSR) { 
        throw new Error("This function should only be called on the server side");
    }
    return createApiClient(sessionId, import.meta.env.PUBLIC_API_URL);
}