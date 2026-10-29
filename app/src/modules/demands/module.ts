import type { ModuleDefinition, ModuleInstance } from "@kernel/modules.ts";
import { demandEvent } from "./domain/events.ts";
import { itemById } from "./infrastructure/items.ts";
import { demandRoutes } from "./http/routes.tsx";

export default {
  config: {
    name: "demands",
    title: "Demandas",
    description: "Tarefas, issues, pastas, tags e visões.",
    order: 20,
    provides: ["demands.lookup"],
  },
  create(context): ModuleInstance {
    const tenantId = context.tenant.id;
    return {
      web: demandRoutes(context.db, tenantId),
      provides: {
        "demands.lookup": {
          getItem: (id: string) => itemById(context.db, tenantId, id),
          recordEvent: (
            itemId: string,
            kind: string,
            from: string | null = null,
            to: string | null = null,
          ) => demandEvent(context.db, tenantId, itemId, null, kind, from, to),
        },
      },
    };
  },
} satisfies ModuleDefinition;
