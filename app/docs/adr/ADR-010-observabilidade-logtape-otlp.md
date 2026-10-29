# ADR-010 — Observabilidade: LogTape + Blake3 + OTLP

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-007, ADR-012 |

## Contexto

Logs precisam ser estruturados, correlacionáveis e sem PII; telemetria precisa ser OTLP sem acoplar
o código a um vendor. O legado usava texto livre e logs não correlacionáveis.

## Decisão

1. **LogTape** com dois sinks: JSON lines em `stderr` (fallback) e **OTLP** (`@logtape/otel`). O sink
   OTLP é fail-open; rede indisponível não derruba request.
2. Campos por request: `request_id` (UUIDv7), `trace_id`, `method`, `path`, `status`,
   `duration_ms`, `user_id`, `tenant_id`.
3. **Redação** antes de qualquer sink: chaves com `password/senha/token/secret/cookie/email/CPF/…`
   viram `[redacted]`; strings longas são truncadas.
4. **Blake3** em `event_hash` de eventos e em ETags/tokens; nunca logar payload ou parâmetros SQL.
5. **OTLP:** `--unstable-otel` no runtime + spans manuais (`@opentelemetry/api`). Endpoint e service
   metadata por env (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, versão/ambiente).
6. O coletor local roda no profile `observability` do Compose, com exporter `debug`; trocar por
   Loki/Tempo/backend OTel é configuração do coletor.

## Justificativa (alternativas descartadas)

- **`console.log` + texto livre** — descartado: não é observável nem auditável.
- **OTel SDK completo no código** — descartado: o runtime Deno já expõe provider; usamos a API.
- **Só OTLP, sem console** — descartado: perde-se o fallback quando o coletor está fora.
- **Logar payload de evento** — descartado: PII e segredos; hash/id bastam para correlação.

## Consequências

**Positivas**
- Zero vendor lock-in; logs legíveis e parseáveis; `trace_id` quando OTel está ativo.
- PII/segredos não saem do processo por acidente.

**Custos / negativas**
- JSON por linha é verboso (CI usa `LOG_LEVEL=error`); OTLP depende do coletor para visualização.
- Spans manuais exigem disciplina para cobrir operações relevantes.

## Exemplo mínimo (comparativo)

```ts
// ❌ PII e texto livre
console.log("login falhou", email, token);

// ✅ logger estruturado + redação; hash, sem payload
logger.warn("login falhou", { request_id, event_hash: blake3Hex(`${userId}:login`) });
```

## Verificação

Boot e requests emitem uma linha JSON por evento; `readyz` não depende do OTLP; spans são no-op sem
provider; teste de redação cobre chaves sensíveis.

## Referências

- `src/kernel/logging/*`, `src/kernel/http/telemetry.ts`
- `public-v7/wiki/adr/ADR-024-observabilidade-nativa-json-rfc7807.md`
