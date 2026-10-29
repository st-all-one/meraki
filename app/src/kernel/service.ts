export interface Registry {
  get<Contract>(name: string): Contract;
  has(name: string): boolean;
}

export interface ServiceDefinition {
  readonly name: string;
  readonly dependencies?: readonly string[];
  create(context: Registry): unknown;
  start?(instance: unknown): void;
  close?(instance: unknown): void;
}

export interface ServiceRegistry extends Registry {
  start(): void;
  close(): void;
  names(): string[];
}

class MapRegistry implements Registry {
  readonly #values: Map<string, unknown>;
  constructor(values: Map<string, unknown>) {
    this.#values = values;
  }
  has(name: string): boolean {
    return this.#values.has(name);
  }
  get<Contract>(name: string): Contract {
    if (!this.#values.has(name)) throw new Error(`Service/porta não registrado: ${name}`);
    return this.#values.get(name) as Contract;
  }
}

export function createServiceRegistry(
  initial: Readonly<Record<string, unknown>>,
  definitions: readonly ServiceDefinition[],
): ServiceRegistry {
  const values = new Map(Object.entries(initial));
  const registry = new MapRegistry(values);
  const ordered: ServiceDefinition[] = [];
  const pending = [...definitions];
  while (pending.length > 0) {
    const index = pending.findIndex((definition) =>
      (definition.dependencies ?? []).every((dependency) => registry.has(dependency))
    );
    if (index < 0) {
      throw new Error(
        `Dependência de service não resolvida: ${pending.map((d) => d.name).join(", ")}`,
      );
    }
    const [definition] = pending.splice(index, 1);
    if (!definition) break;
    values.set(definition.name, definition.create(registry));
    ordered.push(definition);
  }
  let started = false;
  let closed = false;
  return {
    has: (name) => registry.has(name),
    get: <Contract>(name: string) => registry.get<Contract>(name),
    names: () => ordered.map((definition) => definition.name),
    start(): void {
      if (started) return;
      started = true;
      for (const definition of ordered) definition.start?.(values.get(definition.name));
    },
    close(): void {
      if (closed) return;
      closed = true;
      for (const definition of [...ordered].reverse()) {
        definition.close?.(values.get(definition.name));
      }
    },
  };
}
