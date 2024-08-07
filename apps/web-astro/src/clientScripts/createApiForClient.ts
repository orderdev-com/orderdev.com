import { createApiClient } from "api-hono/src/lib/apiClient";

export const createApiForClient = function () {
    return createApiClient(window.token, "/");
}