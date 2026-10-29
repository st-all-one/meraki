import { Hono } from "hono";
import type { ModuleDefinition, ModuleInstance } from "@kernel/modules.ts";
import type { AppEnv } from "@services/auth/contract.ts";
import { sessionContext } from "./application/session.ts";
import { authRoutes } from "./http/auth.tsx";
import { adminRoutes } from "./http/admin.tsx";

export default {
  config: {
    name: "identity",
    title: "Identidade",
    description: "Login, sessão opaca, usuários e cargos.",
    order: 10,
  },
  create(context): ModuleInstance {
    const web = new Hono<AppEnv>();
    web.route("/", authRoutes(context.db, context.tenant.id));
    web.route("/", adminRoutes(context.db, context.tenant.id));
    return { web, middlewares: [sessionContext(context.db)] };
  },
} satisfies ModuleDefinition;
