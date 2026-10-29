import type { ModuleDefinition, ModuleInstance } from "@kernel/modules.ts";
import { chatRoutes } from "./http/routes.tsx";

export default {
  config: {
    name: "conversations",
    title: "Conversas",
    description: "Canais Geral, pasta e demanda com SSE.",
    order: 40,
  },
  create(context): ModuleInstance {
    return { web: chatRoutes(context.db, context.tenant.id) };
  },
} satisfies ModuleDefinition;
