import { sequence } from "astro:middleware";
import { authMiddleware, sessionIdMiddleware } from "./authMiddleware";

export const onRequest = sequence(sessionIdMiddleware, authMiddleware);
