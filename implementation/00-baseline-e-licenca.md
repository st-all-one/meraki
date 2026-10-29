# 00 — Baseline e licença

**Objetivo:** criar `app/` a partir do Somlos congelado, sem alterar `_REF`, e provar que a base compila antes de cortar.

**Duração esperada:** 0,5 dia.

## Pré-requisitos

- Deno 2.9+ no host de desenvolvimento.
- Acesso ao `_REF/somlos` no commit `96ade82` (ou o commit oficial que o time congelar).
- Git limpo o suficiente para um commit de baseline.

## Passos

1. Fixe a origem. Registre no topo de `app/README.md`:

   ```text
   Derivado de _REF/somlos @ 96ade82 (2026-10-27).
   ```

2. Copie sem lixo. Na raiz do meraki:

   ```bash
   mkdir -p app
   rsync -a \
     --exclude '.git' \
     --exclude 'node_modules' \
     --exclude 'data' \
     --exclude '.env' \
     --exclude 'v7_example' \
     --exclude 'implementaion' \
     --exclude 'dist' \
     _REF/somlos/ app/
   ```

3. Confirme que não veio estado local:

   ```bash
   cd app
   test ! -e .env
   test ! -e node_modules
   test ! -e v7_example
   du -sh .
   ```

4. Verifique a base:

   ```bash
   deno --version
   deno task check
   ```

   O `check` deve passar (fmt, lint, types e gates). Se falhar por versão do Deno, registre a versão exata no `README` e ajuste antes de seguir.

5. Rode os testes de núcleo que não dependem de Valkey/RustFS:

   ```bash
   deno task test -- tests/unit
   ```

   Se a suíte unitária ainda exigir `.env`, crie um `.env` local mínimo a partir de `.env.example` **sem copiar segredos** e documente. Não commite `.env`.

6. Valide o binário:

   ```bash
   deno task build:bin
   ./dist/somlos --help 2>/dev/null || true
   ```

   O ponto aqui é provar que o empacotamento funciona; o binário ainda se chama `somlos` e será renomeado na fase 01.

7. Defina a licença:

   - Se o meraki for interno/proprietário: `LICENSE` com “Todos os direitos reservados” e permissão de uso interna.
   - Se for aberto: MIT ou Apache-2.0, mantendo os `NOTICE` de terceiros.
   - Independentemente da escolha, crie `app/NOTICE` citando Somlos, HTMX, daisyUI, ícones e demais dependências com licença própria.

8. Crie o commit de baseline:

   ```bash
   git add app implementation
   git commit -m "chore(app): importa baseline Somlos e licença"
   ```

## Aceite

- [ ] `app/` existe, sem `.env`, `node_modules`, `v7_example` ou `data`.
- [ ] `deno task check` passa.
- [ ] `deno task build:bin` gera o binário.
- [ ] `LICENSE` e `NOTICE` existem.
- [ ] `_REF/somlos` não foi modificado.
- [ ] Commit de baseline criado.

## Riscos

- **Copiar `data/` ou `.env`** traz estado/segredos para o repositório. Se acontecer, remova e rotacione segredos.
- **Atualizar o Deno sem pin** faz o baseline quebrar sem mudança de código. Registre a versão e use no CI.
- **Não copiar `deno.lock`** muda dependências; ele deve ir para `app/`.
