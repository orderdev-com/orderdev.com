import { createApiClient } from "api-hono/src/lib/apiClient";

export const createApiForServer = function (sessionId: string) {
    return createApiClient(sessionId, "https://store.orderdev.local/");
}