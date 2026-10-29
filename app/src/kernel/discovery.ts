import { fromFileUrl } from "@std/path";
import type { ServiceDefinition } from "./service.ts";

const ROOT = new URL("../services/", import.meta.url);

export async function discoverServices(): Promise<ServiceDefinition[]> {
  const definitions: ServiceDefinition[] = [];
  for await (const entry of Deno.readDir(fromFileUrl(ROOT))) {
    if (!entry.isDirectory) continue;
    const url = new URL(`${entry.name}/service.ts`, ROOT);
    try {
      await Deno.stat(fromFileUrl(url));
    } catch {
      continue;
    }
    const loaded = await import(url.href);
    const definition = loaded.default as ServiceDefinition | undefined;
    if (!definition || definition.name !== entry.name) {
      throw new Error(`service inválido em ${url.pathname}`);
    }
    definitions.push(definition);
  }
  return definitions.sort((a, b) => a.name.localeCompare(b.name));
}
