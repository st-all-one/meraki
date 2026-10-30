# Formulários, Rótulos e Validação

## Labels: Obrigatórios para Todo Controle

### Métodos de Associação

```html
<!-- 1. for/id (RECOMENDADO) -->
<label for="email">E-mail</label>
<input type="email" id="email" name="email">

<!-- 2. Aninhamento -->
<label>E-mail
  <input type="email" name="email">
</label>

<!-- 3. aria-label (sem label visível) -->
<input type="search" aria-label="Buscar produtos">

<!-- 4. aria-labelledby (multipart label ou referência externa) -->
<span id="labelPreco">Preço mínimo</span>
<input type="range" aria-labelledby="labelPreco">
```

### Hierarquia do Nome Acessível (Accessible Name Computation)
1. `aria-labelledby` (maior precedência)
2. `aria-label`
3. Atributo nativo (`alt` em img, `title` em frame)
4. `<label>` (for/id ou aninhado)
5. `placeholder` (apenas textbox)
6. `title` (atributo global)

**Nota**: `aria-label` e `aria-labelledby` sobrescrevem `<label>`. Use com cuidado.

## Agrupamento de Controles

### fieldset + legend
```html
<fieldset>
  <legend>Método de pagamento</legend>
  <label><input type="radio" name="pagamento" value="credito"> Crédito</label>
  <label><input type="radio" name="pagamento" value="debito"> Débito</label>
</fieldset>
```

### optgroup
```html
<label for="categoria">Categoria:</label>
<select id="categoria">
  <optgroup label="Eletrônicos">
    <option>Computadores</option>
    <option>Celulares</option>
  </optgroup>
  <optgroup label="Roupas">
    <option>Camisetas</option>
    <option>Calçados</option>
  </optgroup>
</select>
```

## Multipart Labels (aria-labelledby)

Para labels que misturam texto com inputs:
```html
<input aria-labelledby="texto-desligar input-tempo texto-minutos" type="checkbox">
<span id="texto-desligar">Desligar computador após</span>
<input aria-labelledby="texto-desligar input-tempo texto-minutos"
       id="input-tempo" type="text" value="10">
<span id="texto-minutos"> minutos</span>
```

AT anuncia: "Desligar computador após 10 minutos, textbox, 10".

## Instruções e Dicas

```html
<label for="senha">Senha</label>
<input type="password" id="senha"
       aria-describedby="senha-dica"
       aria-required="true">
<p id="senha-dica">Mínimo 8 caracteres, 1 maiúscula, 1 número</p>
```

## Validação e Erros

### Atributos de Validação

```html
<input type="email" id="email" name="email" required
       aria-invalid="true"
       aria-errormessage="email-erro">
<span id="email-erro" role="alert">E-mail inválido</span>
```

### Estratégia de Mensagens de Erro

1. **Associe erro ao campo**: `aria-describedby` ou `aria-errormessage`
2. **Role alert** para mensagem de erro (anúncio imediato)
3. **Foco no primeiro campo com erro** após submissão
4. **Resumo de erros** no topo do formulário com links para cada campo

```html
<div role="alert" aria-live="polite" id="error-summary" tabindex="-1">
  <h2>Erros encontrados:</h2>
  <ul>
    <li><a href="#email">E-mail inválido</a></li>
    <li><a href="#senha">Senha muito curta</a></li>
  </ul>
</div>
```

```js
// Após validação, foca no resumo de erros
errorSummary.focus();
```

### Valores de aria-invalid

| Valor | Significado |
|---|---|
| `false` | Sem erro (padrão implícito) |
| `true` | Erro de validação |
| `grammar` | Erro gramatical (ex: editor de texto) |
| `spelling` | Erro ortográfico |

## Placeholders

### Armadilhas do placeholder

```html
<!-- ERRADO: placeholder como único label -->
<input type="text" placeholder="Nome completo">

<!-- CERTO: label + placeholder (dica adicional) -->
<label for="nome">Nome completo</label>
<input type="text" id="nome" placeholder="Ex: João Silva">
```

**Problemas do placeholder sozinho:**
- Desaparece ao digitar (perda de contexto)
- Contraste geralmente baixo (cinza claro)
- Confundido com valor preenchido
- Não é lido como label por alguns leitores de tela

## Campos Obrigatórios

### Marcação Visual e Programática

```html
<label for="nome">
  Nome <span aria-hidden="true">*</span>
</label>
<input type="text" id="nome" required aria-required="true">
```

**Nota**: `aria-required="true"` é redundante se `required` estiver presente (HTML nativo já expõe), mas é seguro incluir ambos.

## Boas Práticas

1. **Sempre use `<label>`** — nunca confie só em placeholder
2. **Labels visíveis e próximos ao campo** que descrevem
3. **fieldset + legend** para grupos de radio/checkbox
4. **Mensagem de erro específica** (não "Erro genérico")
5. **Erro associado ao campo** via `aria-describedby` ou `aria-errormessage`
6. **Resumo de erros** no topo do formulário
7. **Foco gerenciado**: primeiro erro recebe foco ou resumo recebe foco
8. **Label in Name**: o texto visível do label deve corresponder ao nome acessível (WCAG 2.5.3)
9. **Use `autocomplete`** para campos comuns (name, email, tel, address)

## Referência

- [MDN: aria-required](/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-required)
- [MDN: aria-invalid](/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)
- [MDN: aria-errormessage](/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage)
- [WAI: Designing Accessible Forms](https://www.w3.org/WAI/tutorials/forms/)

## Checklist

- [ ] Todo input tem `<label>` explícito
- [ ] Labels usam `for`/`id` ou estão aninhados corretamente
- [ ] Radio/checkbox agrupados em `<fieldset>` com `<legend>`
- [ ] Placeholder não substitui label
- [ ] `aria-describedby` para dicas/instruções
- [ ] `aria-invalid` atualizado em tempo real na validação
- [ ] Mensagens de erro com `role="alert"` ou em live region
- [ ] Erros associados ao campo correspondente
- [ ] Resumo de erros com foco após submissão inválida
- [ ] Campos obrigatórios marcados visualmente e com `required`/`aria-required`
- [ ] Label visível corresponde ao nome acessível (Label in Name)
- [ ] `autocomplete` implementado para campos comuns
