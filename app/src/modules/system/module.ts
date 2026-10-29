import { Hono } from "hono";
import { join } from "@std/path";
import type { ModuleDefinition, ModuleInstance } from "@kernel/modules.ts";
import type { AppEnv } from "@services/auth/contract.ts";

export default {
  config: {
    name: "system",
    title: "Sistema",
    description: "Health, readiness e arquivos de PWA.",
    order: 5,
  },
  create(context): ModuleInstance {
    const web = new Hono<AppEnv>();
    web.get("/healthz", (c) => c.text("ok"));
    web.get("/readyz", (c) => {
      try {
        context.db.prepare("SELECT 1").get();
        Deno.statSync(join(context.env.dataPath, "attachments"));
        return c.text("ready");
      } catch {
        return c.text("not ready", 503);
      }
    });
    return { web };
  },
} satisfies ModuleDefinition;
