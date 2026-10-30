# Formatos de Data e Hora em HTML

Baseado no padrão ISO 8601 (variação HTML). Elementos que usam estes formatos: `<input type="date">`, `<input type="time">`, `<input type="datetime-local">`, `<input type="month">`, `<input type="week">`, e os atributos `datetime` de `<ins>` e `<del>`.

## Regras Gerais

- **Charset**: sempre ASCII
- **Calendário**: Gregoriano proléptico (estendido ao ano 1 EC)
- **Ano**: mínimo 4 dígitos, padding com zero (`0072` para ano 72)
- **Anos bissextos**: divisível por 400 OU (divisível por 4 E não por 100)
- **Meses**: 01-12, sempre dois dígitos
- **Dias**: 01-31, sempre dois dígitos

## Formatos por Tipo

### Week (semana)

`YYYY-Www` — ex: `2001-W37`

A semana começa na segunda e termina no domingo. A semana 1 é a que contém a primeira quinta-feira do ano.

### Month (mês)

`YYYY-MM` — ex: `2019-01`

### Date (data)

`YYYY-MM-DD` — ex: `1993-11-01`

### Time (hora)

Mínimo: `HH:MM` (ex: `12:15`)
Com segundos: `HH:MM:SS` (ex: `13:44:25`)
Com milissegundos: `HH:MM:SS.mmm` (ex: `00:00:30.75`)

Regras:
- 24h: `00`–`23` para hora
- `00`–`59` para minuto
- `00`–`59` para segundos (sem leap seconds)

### Local Date and Time (datetime-local)

`YYYY-MM-DDTHH:MM` ou com espaço: `YYYY-MM-DD HH:MM`

Separador `T` (obrigatório na forma normalizada). O normalized form remove `:00` de segundos quando zero.

### Global Date and Time (com timezone)

`YYYY-MM-DDTHH:MM:SSZ` — UTC (sufixo `Z`)
`YYYY-MM-DDTHH:MM:SS±HH:MM` — offset explícito

Exemplos:
- `2005-06-07T00:00Z` — meia-noite UTC
- `1789-08-22T12:30:00.1-04:00` — EDT
- `3755-01-01 00:00+10:00` — AEST

## Tabela de Formatos

| Tipo | Formato | Exemplo |
|------|---------|---------|
| Date | `YYYY-MM-DD` | `1993-11-01` |
| Time | `HH:MM` ou `HH:MM:SS` ou `HH:MM:SS.mmm` | `13:44:25` |
| Week | `YYYY-Www` | `2001-W37` |
| Month | `YYYY-MM` | `2019-01` |
| datetime-local | `YYYY-MM-DDTHH:MM` | `1986-01-28T11:38` |
| Global datetime | `YYYY-MM-DDTHH:MM:SSZ` | `2005-06-07T00:00Z` |
| Global c/ offset | `YYYY-MM-DDTHH:MM:SS±HH:MM` | `1789-08-22T12:30:00.1-04:00` |

## Problemas Conhecidos

- **Y2K38**: Servidores com armazenamento de 32-bit signed para datas quebram após 2^31-1 (2038-01-19). JS não sofre pois usa double precision.
- **Y10K**: Anos com mais de 4 dígitos. Usar `value = isoString.substring(0, isoString.indexOf("T") + 6)` no JS.
