import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { HTTPException } from "hono/http-exception";
import { dirname, fromFileUrl, join } from "@std/path";
import type { Runtime } from "./runtime.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { requireLogin, requirePasswordChanged } from "@services/auth/middleware.ts";
import { originGuard } from "@kernel/http/security.ts";
import { env } from "@kernel/config/env.ts";
import { render } from "@kernel/http/render.ts";
import { ErrorPage } from "@layout/views/error.tsx";

export const APP_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");

function securityHeaders(app: Hono<AppEnv>): void {
  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header("Cross-Origin-Opener-Policy", "same-origin");
    c.header("Cross-Origin-Resource-Policy", "same-origin");
    if (env.isProduction) {
      c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    if (!c.req.path.endsWith("/canvas/frame") && !c.res.headers.get("Content-Security-Policy")) {
      c.header(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
          "form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
          "font-src 'self'; connect-src 'self'; frame-src 'self'",
      );
    }
  });
}

export function createApp(runtime: Runtime): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use("*", async (c, next) => {
    c.set("tenantId", runtime.tenant.id);
    c.set("requestId", c.req.header("x-request-id") ?? crypto.randomUUID());
    c.set("actor", null);
    c.header("X-Request-Id", c.get("requestId"));
    await next();
  });
  securityHeaders(app);
  app.use("/static/*", serveStatic({ root: APP_ROOT }));

  app.get("/sw.js", (c) =>
    c.body(Deno.readTextFileSync(join(APP_ROOT, "static/sw.js")), 200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
    }));
  app.get(
    "/manifest.webmanifest",
    (c) =>
      c.body(Deno.readTextFileSync(join(APP_ROOT, "static/manifest.webmanifest")), 200, {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "no-cache",
      }),
  );
  app.get(
    "/offline.html",
    (c) =>
      c.body(Deno.readTextFileSync(join(APP_ROOT, "static/offline.html")), 200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      }),
  );

  app.use("*", originGuard());
  for (const module of runtime.modules) {
    for (const middleware of module.instance.middlewares ?? []) app.use("*", middleware);
  }
  app.use("*", requireLogin());
  app.use("*", requirePasswordChanged());
  for (const module of runtime.modules) {
    if (module.instance.web) app.route("/", module.instance.web);
  }

  app.notFound((c) => {
    const actor = c.get("actor") ?? null;
    return render(
      c,
      (
        <ErrorPage
          actor={actor}
          status={404}
          title="Não encontrado"
          detail="A página ou demanda não existe."
          requestId={c.get("requestId")}
        />
      ),
      404,
    );
  });

  app.onError((error, c) => {
    const status = error instanceof HTTPException ? error.status : 500;
    const message = error instanceof HTTPException
      ? error.message
      : "Algo deu errado. Tente novamente.";
    if (status >= 500) {
      console.error(JSON.stringify({ request_id: c.get("requestId"), error: String(error) }));
    }
    c.header("Cache-Control", "no-store");
    if (c.req.header("hx-request") === "true") {
      return c.html(`<div class="alert alert-danger" role="alert">${message}</div>`, status);
    }
    const actor = c.get("actor") ?? null;
    return render(
      c,
      (
        <ErrorPage
          actor={actor}
          status={status}
          title={status === 403 ? "Sem permissão" : status === 404 ? "Não encontrado" : "Erro"}
          detail={message}
          requestId={c.get("requestId")}
        />
      ),
      status,
    );
  });

  return app;
}
