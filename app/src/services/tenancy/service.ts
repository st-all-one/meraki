import type { Db } from "@kernel/db/database.ts";
import { one } from "@kernel/db/database.ts";
import type { Tenant } from "./contract.ts";

export function tenant(db: Db): Tenant {
  const found = one<Tenant>(db, "SELECT id, slug, name FROM tenants ORDER BY created_at LIMIT 1");
  if (!found) throw new Error("tenant ausente: rode `meraki seed`");
  return found;
}

export default {
  name: "tenancy",
  dependencies: ["database"],
  create(context: { get<T>(name: string): T }) {
    const database = context.get<{ db: Db }>("database");
    return { current: () => tenant(database.db) };
  },
};
