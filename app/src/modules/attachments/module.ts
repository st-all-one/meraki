import type { ModuleDefinition, ModuleInstance } from "@kernel/modules.ts";
import type { DemandsLookup } from "./application/ports.ts";
import { attachmentRoutes } from "./http/routes.tsx";

export default {
  config: {
    name: "attachments",
    title: "Anexos",
    description: "Upload local validado e download autenticado.",
    order: 30,
    requires: ["demands.lookup"],
  },
  create(context): ModuleInstance {
    const demands = context.ports.get<DemandsLookup>("demands.lookup");
    return { web: attachmentRoutes(context.db, context.tenant.id, demands) };
  },
} satisfies ModuleDefinition;
