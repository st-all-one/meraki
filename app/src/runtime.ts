import type { Db } from "@kernel/db/database.ts";
import { openDb } from "@kernel/db/database.ts";
import type { Env } from "@kernel/config/env.ts";
import { env } from "@kernel/config/env.ts";
import { createServiceRegistry, type Registry, type ServiceRegistry } from "@kernel/service.ts";
import { discoverServices } from "@kernel/discovery.ts";
import { assertNoRouteCollisions, discoverModules, type LoadedModule } from "@kernel/modules.ts";
import type { Tenant } from "@services/tenancy/contract.ts";

export interface Runtime {
  readonly db: Db;
  readonly services: ServiceRegistry;
  readonly modules: LoadedModule[];
  readonly tenant: Tenant;
  close(): void;
}

class PortRegistry implements Registry {
  readonly #values = new Map<string, unknown>();
  has(name: string): boolean {
    return this.#values.has(name);
  }
  get<Contract>(name: string): Contract {
    if (!this.#values.has(name)) throw new Error(`Porta não registrada: ${name}`);
    return this.#values.get(name) as Contract;
  }
  set(name: string, value: unknown): void {
    this.#values.set(name, value);
  }
}

export async function createRuntime(config: Env = env): Promise<Runtime> {
  const db = openDb(config.dbPath);
  const services = createServiceRegistry(
    { database: { db } },
    await discoverServices(),
  );
  services.start();
  const currentTenant = services.get<{ current(): Tenant }>("tenancy").current();
  const ports = new PortRegistry();
  const definitions = await discoverModules();
  const modules: LoadedModule[] = [];
  for (const definition of definitions) {
    for (const required of definition.config.requires ?? []) {
      if (!ports.has(required)) {
        throw new Error(`Módulo ${definition.config.name} requer porta ${required}`);
      }
    }
    const instance = definition.create({
      db,
      services,
      ports,
      tenant: currentTenant,
      env: config,
    });
    modules.push({ definition, instance });
    for (const [name, value] of Object.entries(instance.provides ?? {})) ports.set(name, value);
  }
  assertNoRouteCollisions(modules);
  return {
    db,
    services,
    modules,
    tenant: currentTenant,
    close(): void {
      services.close();
      db.close();
    },
  };
}
