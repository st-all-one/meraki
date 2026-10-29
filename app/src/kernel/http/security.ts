import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "@kernel/config/env.ts";

/** Origin + Fetch Metadata para toda mutação. */
export function originGuard(): MiddlewareHandler {
  return async (c, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      await next();
      return;
    }
    const origin = c.req.header("origin");
    const site = c.req.header("sec-fetch-site");
    if (origin !== env.appUrl && site !== "same-origin" && site !== "none") {
      throw new HTTPException(403, { message: "Origem inválida" });
    }
    await next();
  };
}
