import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Action, Resource, ResourceContext, Role } from "./policy.ts";
import { can } from "./policy.ts";
import type { AppEnv } from "@kernel/auth/context.ts";

const PUBLIC_PREFIXES = [
  "/login",
  "/healthz",
  "/readyz",
  "/static/",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
];

export function requireLogin(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (PUBLIC_PREFIXES.some((prefix) => c.req.path === prefix || c.req.path.startsWith(prefix))) {
      await next();
      return;
    }
    if (!c.get("actor")) {
      if (c.req.header("hx-request") === "true") {
        c.header("HX-Redirect", "/login");
        return c.text("", 401);
      }
      return c.redirect(`/login?next=${encodeURIComponent(c.req.path)}`, 302);
    }
    await next();
    return;
  };
}

export function requirePasswordChanged(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const actor = c.get("actor");
    if (
      actor?.mustChangePassword &&
      !c.req.path.startsWith("/account/password") &&
      c.req.path !== "/logout"
    ) {
      return c.redirect("/account/password", 303);
    }
    await next();
    return;
  };
}

export function requireRole(roles: readonly Role[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const actor = c.get("actor");
    if (!actor) throw new HTTPException(401, { message: "Faça login" });
    if (!roles.includes(actor.role)) throw new HTTPException(403, { message: "Sem permissão" });
    await next();
    return;
  };
}

export function requireCan(
  action: Action,
  resource: Resource,
  context: ResourceContext = {},
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const actor = c.get("actor");
    if (!actor) throw new HTTPException(401, { message: "Faça login" });
    if (!can(actor, action, resource, context)) {
      throw new HTTPException(403, { message: "Sem permissão" });
    }
    await next();
    return;
  };
}
