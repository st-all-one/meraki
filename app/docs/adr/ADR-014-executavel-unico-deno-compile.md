# ADR-014 — Executável único opcional via `deno compile`

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-000, ADR-003, ADR-009, ADR-012 |

## Contexto

O runtime Deno já entrega um único processo, mas o ambiente de servidor ainda precisa de Deno
instalado, `node_modules`/cache e os diretórios `src/layout`, `src/modules`, `src/services`, `src/db` (migrations) e `static/` ao lado do
código. Para deploy em systemd, máquina limpa ou imagem mínima, um **executável único** reduz
superfície e elimina “funciona na minha máquina”. O `deno compile` empacota runtime, código,
dependências e arquivos incluídos; a dúvida era se as particularidades do projeto (SQLite nativo,
JSX, assets, OTLP, migrations) sobreviveriam.

## Decisão

1. **Build opcional, não padrão.** `deno task build:bin` gera `dist/somlos`; Docker/Deno continuam o
   caminho de desenvolvimento. A imagem mínima é `Dockerfile.binary`.
2. **Assets e manifestos entram via `--include`:** `src/layout`, `src/modules`, `src/services`, `src/db` e `static`. O `deno compile` cria um
   FS virtual; o leitor de migrations resolve caminhos por `import.meta.url`, então
   funcionam sem alteração.
3. **`serveStatic` usa raiz relativa ao módulo**, não ao cwd: `APP_ROOT` é derivado de
   `import.meta.url`. Assim o binário serve CSS/HTMX/ícones de qualquer diretório.
4. **Subcomandos no próprio binário:** `somlos migrate`, `somlos db:reset` e `somlos seed`; sem
   argumento, inicia o servidor. Migrations e seed são importados dinamicamente e embutidos.
5. **Configuração só por ambiente.** O binário não lê `.env`; use `EnvironmentFile` (systemd),
   `env_file`/`environment` (Compose) ou variáveis exportadas. `DB_PATH` absoluto é recomendado.
6. **Permissões fixadas no build:** `--allow-net --allow-env --allow-read --allow-write`. Nada de
   `-A`; o binário compilado carrega as permissões.
7. **Build por plataforma.** `deno task build:bin:linux` usa
   `--target x86_64-unknown-linux-gnu`; o artefato é específico de SO/arquitetura. O CI publica o
   binário Linux x64 como artefato e uma imagem `binary`.
8. **Imagem mínima:** `debian:bookworm-slim` + `ca-certificates` + binário, usuário 1000, `/app/data`
   para SQLite. Sem Deno, sem shell de aplicação, sem assets externos.

## Justificativa (alternativas descartadas)

- **Manter apenas Deno + diretórios** — descartada para servidores limpos: exige runtime e arquivos
  externos; o binário simplifica systemd e reduz drift.
- **Bundler externo (esbuild/bun build)** — descartado: `deno compile` é oficial, entende npm/jsr,
  `node:sqlite` e o runtime, sem etapa extra.
- **Gerar um módulo TS com assets em base64** — descartado: infla o código e o tempo de build; o FS
  virtual do `--include` já resolve, desde que a raiz seja derivada do módulo.
- **`--include` do diretório inteiro do projeto** — descartado: embutiria `.env`, `data/` e lixo;
  a lista é explícita e revisada.
- **Fazer do binário o único artefato** — descartado: perde hot reload e depuração; Docker/Deno
  continuam melhores para dev.

## Consequências

**Positivas**
- Deploy = copiar um arquivo; sem instalação de runtime, `node_modules` ou cache.
- Asset/migration drift impossível: tudo é da mesma compilação.
- Imagem mínima (~255 MB vs ~493 MB da imagem Deno) e superfície menor.
- `node:sqlite`, TLS, OTLP e Hono funcionam no binário (verificado).

**Custos / negativas**
- Binário grande (~165 MB) e **específico de plataforma**; matriz de build por SO/arch.
- `--include` é manual: view/asset/migration/módulo/service novo exige conferir a lista (ou usar o diretório
  correto).
- Sem `.env` automático; configuração é responsabilidade do supervisor.
- `--allow-read` continua necessário para o FS virtual e para `DB_PATH`; não é sandbox total.
- Não substitui migração de dados/backup; SQLite segue em volume.

## Exemplo mínimo (comparativo)

```bash
# ❌ servidor precisa de Deno, cache e três diretórios no lugar certo
deno run --allow-net --allow-env --allow-read --allow-write src/main.ts

# ✅ um arquivo, assets e migrations embutidos; migra e sobe
deno task build:bin
DB_PATH=/var/lib/somlos/somlos.sqlite3 ./dist/somlos migrate
DB_PATH=/var/lib/somlos/somlos.sqlite3 ./dist/somlos          # servidor
```

## Verificação

- `deno task build:bin` produz o binário.
- Executado a partir de `/tmp` (sem `src/` ou `static/` ao lado) respondeu
  `200` para `/`, `/login`, `/_/status`, CSS, HTMX e ícone; `migrate`/`seed` funcionaram.
- Playwright + axe contra o binário: 5/5.
- `Dockerfile.binary` sobe, serve e `/readyz` retorna SQLite + Valkey + RustFS ok.

## Referências

- https://docs.deno.com/runtime/reference/cli/compile/
- `Dockerfile.binary`, `deno.json` (`build:bin`), `src/app.tsx` (`APP_ROOT`), `src/main.ts`
