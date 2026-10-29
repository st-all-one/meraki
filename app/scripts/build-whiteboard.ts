import { join } from "@std/path";

const root = new URL("../", import.meta.url);
const outDir = new URL("static/whiteboard/", root);
await Deno.mkdir(outDir, { recursive: true });

const command = new Deno.Command(Deno.execPath(), {
  args: [
    "run",
    "-A",
    "npm:esbuild@0.25.0",
    "frontend/whiteboard/main.tsx",
    "--bundle",
    "--format=esm",
    "--minify",
    "--sourcemap",
    "--conditions=production",
    "--loader:.woff2=file",
    "--loader:.woff=file",
    "--loader:.ttf=file",
    `--outfile=${new URL("whiteboard.js", outDir).pathname}`,
    '--define:process.env.NODE_ENV="production"',
  ],
  cwd: new URL(".", root).pathname,
  stdout: "inherit",
  stderr: "inherit",
});
const result = await command.output();
if (!result.success) Deno.exit(result.code);

const pkg = join(root.pathname, "node_modules/@excalidraw/excalidraw/dist/prod");
const cssFiles = [["index.css", "whiteboard.css"]] as const;
for (const [from, to] of cssFiles) {
  try {
    await Deno.copyFile(join(pkg, from), new URL(to, outDir));
  } catch {
    // CSS é importado pelo bundle; fallback não bloqueia.
  }
}
async function copyFonts(from: string, to: URL): Promise<void> {
  await Deno.mkdir(to, { recursive: true });
  for await (const entry of Deno.readDir(from)) {
    const source = join(from, entry.name);
    const target = new URL(`${entry.name}${entry.isDirectory ? "/" : ""}`, to);
    if (entry.isDirectory) await copyFonts(source, target);
    else await Deno.copyFile(source, target);
  }
}
try {
  await copyFonts(join(pkg, "fonts"), new URL("fonts/", outDir));
} catch {
  // Fontes podem estar embutidas.
}
console.log(JSON.stringify({ ok: true, out: new URL("whiteboard.js", outDir).pathname }));
