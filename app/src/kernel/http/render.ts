import type { Context } from "hono";
import { html } from "hono/html";
import type { Child } from "hono/jsx";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export async function render(
  c: Context,
  page: Child,
  status: ContentfulStatusCode = 200,
): Promise<Response> {
  c.status(status);
  return await c.html(html`<!doctype html>${page}`);
}

export function noStore(c: Context): void {
  c.header("Cache-Control", "no-store");
}

export function wantsPartial(c: Context): boolean {
  return c.req.header("hx-request") === "true";
}

export function text(body: Record<string, unknown>, name: string): string {
  const value = body[name];
  return typeof value === "string" ? value.trim() : "";
}

export function numberValue(body: Record<string, unknown>, name: string, fallback = 0): number {
  const value = Number(body[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function fileValues(body: Record<string, unknown>, name: string): File[] {
  const value = body[name];
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.filter((item): item is File => item instanceof File && item.size > 0);
}

export function back(c: Context, fallback: string): Response {
  const referer = c.req.header("referer");
  if (!referer) return c.redirect(fallback, 303);
  try {
    const url = new URL(referer);
    if (url.origin === new URL(c.req.url).origin) {
      return c.redirect(`${url.pathname}${url.search}`, 303);
    }
  } catch {
    // URL malformada: fallback local.
  }
  return c.redirect(fallback, 303);
}
