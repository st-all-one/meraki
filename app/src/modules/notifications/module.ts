import type { ModuleDefinition, ModuleInstance } from "@kernel/modules.ts";
import { accountRoutes } from "./http/routes.tsx";

export default {
  config: {
    name: "notifications",
    title: "Notificações",
    description: "Inbox, preferências e Web Push.",
    order: 60,
  },
  create(context): ModuleInstance {
    return { web: accountRoutes(context.db, context.tenant.id) };
  },
} satisfies ModuleDefinition;
