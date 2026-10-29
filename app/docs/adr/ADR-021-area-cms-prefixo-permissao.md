# ADR-021 — Área CMS no prefixo `/cms`, sessão compartilhada e guarda por permissão

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Incorporação seletiva do public-v7 |
| **Relacionadas** | ADR-006, ADR-008, ADR-018, ADR-019, ADR-020 |

## Contexto

O Somlos já tinha autenticação, sessão opaca, RBAC e páginas de fundação (`/`, `/login`, `/app`),
mas nenhuma tela de produto. O public-v7 separa portal, CMS e API por host/área; reproduzir isso
exige decisão sobre URL, cookie e guarda. As alternativas eram:

- subdomínio `cms.*` com cookie próprio: exige DNS/certificado/proxy adicionais e um segundo login;
- prefixo `/cms` na mesma origem: funciona atrás de qualquer proxy, reaproveita a sessão opaca e o
  CSRF de origem única;
- área só por API: não entrega a tela visível que o produto precisa agora.

## Decisão

1. **Prefixo `/cms`** na mesma origem, com a mesma sessão opaca (`httpOnly`, `SameSite=Lax`).
   Portal, CMS e API continuam separados por rota/módulo, não por host.
2. **Guarda deny-by-default** no módulo `cms`: `requireSession()` e permissão `cms.access`, resolvida
   no banco a cada requisição (revogar papel vale na próxima chamada). Sem permissão: página 403
   renderizada (não texto puro) e evidência `cms.access_denied` na auditoria.
3. **Permissões declaradas no manifesto** (`ModuleConfig.permissions`). O core valida formato e
   unicidade no boot; `cms.access` pertence ao módulo `cms`.
4. **Shell como dado do tenant** (`cms_settings`): título, ícone do logo, posição da navegação
   (`left`, `right`, `orbital`), URL inicial e regiões ativas (`sidebar`, `header`, `footer`).
   A linha padrão é criada na primeira leitura, de forma idempotente; nenhuma tela depende de seed.
   A ordem do DOM segue a posição visual (aside antes ou depois do main) para preservar o foco.
5. **Sem cookie separado e sem novo login.** `/cms` anônimo redireciona para
   `/login?next=%2Fcms`; o formulário já valida `next` com `safeNextPath`.
6. **Sem indexação**: `X-Robots-Tag: noindex, nofollow, noarchive` e `Cache-Control: private,
   no-store` em `/cms`; o link para o CMS só aparece em `/app` quando o ator tem `cms.access`.
7. **Sem editor nesta etapa**: o shell é somente leitura; CRUD de conteúdo/mídia entra nos módulos
   seguintes, reutilizando o AST validado da ADR-020.

## Consequências

**Positivas**

- Primeira tela de produto visível sem infraestrutura nova (DNS, certificado, segundo login).
- A guarda e a auditoria são testáveis no mesmo app HTTP, sem proxy.
- O shell é configurável por tenant sem deploy e já nasce com defaults seguros.
- Permissões declaradas dão base para o gate de vocabulário do RBAC (item 7 do staging).

**Custos / negativas**

- Um segundo cookie/área isolada exigiria ADR própria se o CMS for exposto em outro host.
- A escrita do shell ainda não tem UI/API; hoje é somente leitura (a edição entra junto do CRUD).
- A linha padrão é criada na primeira requisição autenticada (uma escrita idempotente).

## Verificação

- `tests/integration/app_test.ts`: admin recebe 200 com “Somlos CMS”, `private, no-store` e
  `X-Robots-Tag`; anônimo recebe 302 para `/login?next=%2Fcms`; membro sem papel recebe 403 e gera
  `cms.access_denied`; link “Abrir CMS” aparece só para admin.
- Smoke manual: `/cms?lang=fr` mantém `<html lang="fr">` e o shell traduzido.
- Gate de views continua sem inline/CDN.

## Referências

- `src/modules/cms/`, `src/modules/cms/migrations/0003_cms_settings.sql`, `src/modules/cms/views/`
- `src/kernel/modules.ts` (declaração/validação de permissões)
- `src/kernel/http/security.ts` (`/cms` fora de indexação)
