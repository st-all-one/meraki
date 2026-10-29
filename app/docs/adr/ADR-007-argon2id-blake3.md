# ADR-007 — Argon2id para senhas e Blake3 para tokens/integridade

| Campo | Valor |
| :--- | :--- |
| **Status** | Aceito (2026-10-23) |
| **Data** | 2026-10-23 |
| **Plano de origem** | Fundação Somlos |
| **Relacionadas** | ADR-000, ADR-006, ADR-008, ADR-010 |

## Contexto

Senhas exigem função de derivação lenta e memory-hard; tokens de alta entropia e ETags exigem hash
rápido, determinístico e sem sal. A stack define “Argon2id + blake3”.

## Decisão

1. **Senhas:** Argon2id (`@noble/hashes`), PHC string com parâmetros embutidos
   (`$argon2id$v=19$m=19456,t=2,p=1$sal$hash`). Parâmetros vêm de `ARGON2_*` e podem subir sem
   invalidar hashes antigos; `needsRehash()` atualiza no login.
2. **Tokens opacos:** hash **Blake3-256** em hexadecimal antes de persistir. Token bruto nunca é
   logado nem armazenado.
3. **ETag:** Blake3 do corpo da resposta, forte, estável para HTML determinístico.
4. **Integridade de eventos:** `event_hash = blake3(id + name)` nos logs, permitindo correlação e
   detecção de adulteração sem guardar payload/PII.
5. Comparações de segredos usam tempo constante (`timingSafeEqual`).
6. Argon2 nativo (`npm:argon2`) não é usado para evitar FFI/build nativo no container; a troca exige
   ADR e benchmark.

## Justificativa (alternativas descartadas)

- **Argon2 nativo** — descartada: build/FFI no container por um ganho de ~200 ms no login; a versão
  pura simplifica o deploy.
- **bcrypt/scrypt** — descartados: a stack pede Argon2id, memory-hard e resistente a GPU/ASIC.
- **SHA-256 para senha** — descartado: rápido demais, inseguro para senha.
- **Blake3 com sal para senha** — descartado: Blake3 não é KDF memory-hard.

## Consequências

**Positivas**
- Hashes autocontidos; zero dependência nativa; bom desempenho em Deno/container.
- Rotação de custo é segura; tokens e ETags têm hash estável.

**Custos / negativas**
- Argon2id em JS é mais lento que o nativo (~150–300 ms por hash nos parâmetros atuais); aceitável e
  proposital contra força bruta.
- Parâmetros armazenados no PHC podem envelhecer; `needsRehash` cobre no próximo login.

## Exemplo mínimo (comparativo)

```ts
// ❌ senha com hash rápido e token em claro
const hash = blake3Hex(password);
users.token = token;

// ✅ Argon2id com PHC; apenas hash Blake3 do token
const passwordHash = hashPassword(password);
sessions.token_hash = blake3Hex(token);
```

## Verificação

Testes unitários verificam vetor Blake3 conhecido, formato PHC, aceitação/rejeição de senha, rehash e
comparação em tempo constante.

## Referências

- `src/kernel/crypto/*`
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
