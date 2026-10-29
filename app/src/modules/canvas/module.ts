import type { ModuleDefinition, ModuleInstance } from "@kernel/modules.ts";
import type { DemandsLookup } from "./application/ports.ts";
import { canvasRoutes } from "./http/routes.tsx";

export default {
  config: {
    name: "canvas",
    title: "Canvas",
    description: "Excalidraw colaborativo por demanda.",
    order: 50,
    requires: ["demands.lookup"],
  },
  create(context): ModuleInstance {
    const demands = context.ports.get<DemandsLookup>("demands.lookup");
    return { web: canvasRoutes(context.db, context.tenant.id, demands) };
  },
} satisfies ModuleDefinition;
