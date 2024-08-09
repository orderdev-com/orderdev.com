import { sequence } from "astro:middleware";
import { authMiddleware } from "./authMiddleware";
import { sessionIdMiddleware } from "./sessionIdMiddleware";

export const onRequest = sequence(sessionIdMiddleware, authMiddleware);
