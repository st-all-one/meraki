import { fromFileUrl } from "@std/path";
import type { Hono } from "hono";
import type { Db } from "./db/database.ts";
import type { AppEnv } from "./auth/context.ts";
import type { Env } from "./config/env.ts";
import type { Registry } from "./service.ts";

export interface ModuleConfig {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly order?: number;
  readonly provides?: readonly string[];
  readonly requires?: readonly string[];
}

export interface ModuleContext {
  readonly db: Db;
  readonly services: Registry;
  readonly ports: Registry;
  readonly tenant: { id: string; slug: string; name: string };
  readonly env: Env;
}

export interface ModuleInstance {
  readonly web?: Hono<AppEnv>;
  readonly middlewares?: readonly import("hono").MiddlewareHandler[];
  readonly provides?: Readonly<Record<string, unknown>>;
}

export interface ModuleDefinition {
  readonly config: ModuleConfig;
  create(context: ModuleContext): ModuleInstance;
}

export interface LoadedModule {
  readonly definition: ModuleDefinition;
  readonly instance: ModuleInstance;
}

const ROOT = new URL("../modules/", import.meta.url);

export async function discoverModules(): Promise<ModuleDefinition[]> {
  const modules: ModuleDefinition[] = [];
  for await (const entry of Deno.readDir(fromFileUrl(ROOT))) {
    if (!entry.isDirectory) continue;
    const url = new URL(`${entry.name}/module.ts`, ROOT);
    const loaded = await import(url.href);
    const definition = loaded.default as ModuleDefinition | undefined;
    if (!definition || definition.config.name !== entry.name) {
      throw new Error(`módulo inválido em ${url.pathname}`);
    }
    modules.push(definition);
  }
  return modules.sort((a, b) =>
    (a.config.order ?? 100) - (b.config.order ?? 100) ||
    a.config.name.localeCompare(b.config.name)
  );
}

export function assertNoRouteCollisions(modules: readonly LoadedModule[]): void {
  const owners = new Map<string, string>();
  for (const module of modules) {
    for (const route of module.instance.web?.routes ?? []) {
      const key = `${route.method} ${route.path}`;
      const owner = owners.get(key);
      if (owner && owner !== module.definition.config.name) {
        throw new Error(`rota duplicada ${key} (${owner}, ${module.definition.config.name})`);
      }
      owners.set(key, module.definition.config.name);
    }
  }
}
