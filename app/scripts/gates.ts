/**
 * Gates de arquitetura do Meraki.
 *
 * Não substituem ADRs: tornam explícitas as fronteiras que o runtime modular assume.
 * Falha com lista de violações; não tenta corrigir nada.
 */
const root = new URL("../", import.meta.url);
const errors: string[] = [];

interface SourceFile {
  readonly url: URL;
  readonly rel: string;
  readonly text: string;
}

async function walk(dir: URL): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.name === "node_modules" || entry.name === "data" || entry.name === ".git") continue;
    const child = new URL(`${entry.name}${entry.isDirectory ? "/" : ""}`, dir);
    if (entry.isDirectory) {
      files.push(...await walk(child));
    } else if (/\.(ts|tsx|sql)$/.test(entry.name)) {
      files.push({
        url: child,
        rel: child.pathname.slice(root.pathname.length),
        text: await Deno.readTextFile(child),
      });
    }
  }
  return files;
}

function fail(rel: string, message: string): void {
  errors.push(`${rel}: ${message}`);
}

function imports(text: string): string[] {
  return [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]!);
}

async function exists(rel: string): Promise<boolean> {
  try {
    await Deno.stat(new URL(rel, root));
    return true;
  } catch {
    return false;
  }
}

const files = await walk(new URL("src/", root));
const src = new Map(files.map((file) => [file.rel, file]));

for (
  const rel of [
    "src/main.ts",
    "src/app.tsx",
    "src/runtime.ts",
    "src/kernel/modules.ts",
    "src/kernel/discovery.ts",
    "src/kernel/auth/context.ts",
    "static/css/app.css",
    "static/js/app.js",
    "static/sw.js",
    "static/manifest.webmanifest",
    "../.env.example",
    "../compose.yaml",
    "../compose.prod.yaml",
    "../Makefile",
    "Dockerfile",
    ".dockerignore",
    "docker/entrypoint.sh",
    "docker/caddy/Caddyfile",
    "docker/caddy/Caddyfile.prod",
  ]
) {
  if (!await exists(rel)) errors.push(`${rel}: arquivo obrigatório ausente`);
}

// 1. Fronteiras entre camadas.
for (const file of files) {
  const layer = file.rel.split("/")[1];
  for (const spec of imports(file.text)) {
    const forbidden = (pattern: RegExp) => pattern.test(spec);
    if (layer === "kernel") {
      if (forbidden(/^@(services|modules|layout)\//) || forbidden(/^@\//)) {
        fail(file.rel, `kernel não pode importar camada externa: ${spec}`);
      }
      if (forbidden(/db\/schema/)) {
        fail(file.rel, `kernel não pode importar schema composto: ${spec}`);
      }
    }
    if (layer === "services") {
      if (forbidden(/^@(modules|layout)\//) || forbidden(/^@\//)) {
        fail(file.rel, `service não pode importar camada de cima: ${spec}`);
      }
    }
    if (layer === "modules") {
      const own = file.rel.split("/")[2];
      const target = spec.match(/^@modules\/([^/]+)\//);
      if (target && target[1] !== own) {
        fail(file.rel, `módulo "${own}" importa o módulo "${target[1]}" diretamente: ${spec}`);
      }
      if (forbidden(/^@\//)) {
        fail(
          file.rel,
          `módulo deve usar aliases explícitos (@kernel/@services/@layout), não @/: ${spec}`,
        );
      }
      if (!/\/(http|views)\//.test(file.rel) && forbidden(/^@layout\//)) {
        fail(file.rel, `somente http/ e views/ podem importar @layout: ${spec}`);
      }
    }
    if (layer === "layout" && forbidden(/^@modules\//)) {
      fail(file.rel, `layout compartilhado não pode importar módulo: ${spec}`);
    }
  }
}

// 2. Manifestos por convenção.
for (const layer of ["modules", "services"] as const) {
  for await (const entry of Deno.readDir(new URL(`src/${layer}/`, root))) {
    if (!entry.isDirectory) continue;
    const rel = `src/${layer}/${entry.name}`;
    if (layer === "modules" && !await exists(`${rel}/module.ts`)) {
      errors.push(`${rel}: módulo sem module.ts`);
    }
    if (layer === "services") {
      const library = entry.name === "audit" || entry.name === "markdown";
      if (!library && !await exists(`${rel}/service.ts`)) {
        errors.push(`${rel}: service sem service.ts`);
      }
      if (!library) {
        const manifest = await Deno.readTextFile(new URL(`${rel}/service.ts`, root));
        if (
          !/export\s+default\s*\{/.test(manifest) || !/\bname\s*:/.test(manifest) ||
          !/\bcreate\s*\(/.test(manifest)
        ) {
          errors.push(`${rel}/service.ts: manifesto de serviço ausente`);
        }
      }
    }
  }
}

// 3. Migrations up-only: versão única, nome estável, dono na própria árvore.
const versions = new Map<string, string>();
for (const file of files) {
  if (!file.rel.endsWith(".sql")) continue;
  const name = file.rel.split("/").at(-1)!;
  const match = name.match(/^(\d{4})_[a-z0-9_]+\.sql$/);
  if (!match) {
    fail(file.rel, "nome de migration deve ser NNNN_snake_case.sql");
    continue;
  }
  const owner = file.rel.startsWith("src/db/migrations/")
    ? "db"
    : file.rel.replace(/\/migrations\/.*$/, "");
  if (
    !file.rel.startsWith("src/db/migrations/") && !owner.match(/^src\/(modules|services)\/[^/]+$/)
  ) {
    fail(file.rel, "migration fora da árvore do dono");
  }
  const previous = versions.get(match[1]!);
  if (previous) fail(file.rel, `versão ${match[1]} duplicada com ${previous}`);
  versions.set(match[1]!, file.rel);
}

// 4. Views são markup puro: sem handlers/estilo inline, sem script inline.
for (const file of files) {
  if (!/\/views\/.*\.tsx$/.test(file.rel)) continue;
  if (/\bstyle\s*=/.test(file.text)) fail(file.rel, "style= inline proibido em view");
  if (/\bon(click|change|submit|load|error|input|keydown|keyup|mouseover)\s*=/i.test(file.text)) {
    fail(file.rel, "handler inline proibido em view");
  }
  if (file.rel !== "src/layout/views/markdown.tsx" && /dangerouslySetInnerHTML/.test(file.text)) {
    fail(file.rel, "HTML bruto proibido em view (use <Markdown>)");
  }
  for (const match of file.text.matchAll(/<script\b[^>]*>/gi)) {
    if (!/\bsrc\s*=/.test(match[0])) fail(file.rel, "script inline proibido em view");
  }
}

// 5. Dependências e segredos.
const forbidden = [
  /from\s+["'][^"']*(valkey|rustfs|nodemailer|@tiptap|opentelemetry)[^"']*["']/i,
  /https?:\/\/(cdn|fonts|unpkg|jsdelivr)\./i,
  /Access-Control-Allow-Origin["']?\s*[:,]\s*["']\*/i,
  /\bas\s+any\b/,
];
for (const file of files) {
  for (const pattern of forbidden) {
    if (pattern.test(file.text)) fail(file.rel, `conteúdo proibido (${pattern})`);
  }
}

const example = await Deno.readTextFile(new URL("../.env.example", root));
if (/VAPID_PRIVATE_KEY=\S+/.test(example) || /SEED_PASSWORD=(?!troque)[^\s]+/.test(example)) {
  errors.push("../.env.example: contém segredo real");
}

for (
  const rel of [...src.keys()].filter((rel) =>
    /\/(identity|conversations)\/migrations\/$/.test(rel)
  )
) {
  errors.push(`${rel}: diretório de migrations vazio`);
}

if (errors.length > 0) {
  console.error(`gates: ${errors.length} violação(ões)`);
  for (const error of errors) console.error(`- ${error}`);
  Deno.exit(1);
}
console.log(`gates: ok (${files.length} arquivos, ${versions.size} migrations)`);
