# Image Maps (Mapas de Imagem)

Criar regiões clicáveis (hotspots) em uma imagem usando `<map>` e `<area>`.

> [!WARNING]
> Prefira links de texto (estilizados com CSS) a image maps. Text links são mais leves, acessíveis, SEO-friendly e maintainable.

## Estrutura Básica

```html
<img src="mapa.png" alt="" usemap="#meu-mapa" />

<map name="meu-mapa">
  <area shape="circle" coords="200,250,25"
        href="pagina2.html" alt="Exemplo circular" />
  <area shape="rect" coords="10,5,20,15"
        href="pagina3.html" alt="Exemplo retangular" />
</map>
```

## Atributos do `<area>`

| Atributo | Descrição |
|----------|-----------|
| `shape` | `circle`, `rect`, `poly` ou `default` |
| `coords` | Coordenadas em CSS pixels (dependente de `shape`) |
| `href` | URL do link (pode ser vazio se não quiser link) |
| `alt` | **Obrigatório** — texto alternativo para o link |
| `target` | Onde abrir o link (`_blank`, `_self`, etc.) |
| `rel` | Relação do link (`noopener`, `noreferrer`, etc.) |

### Formatos de `coords` por `shape`

| shape | Formato | Exemplo |
|-------|---------|---------|
| `circle` | `cx,cy,raio` | `200,250,25` |
| `rect` | `x1,y1,x2,y2` (canto sup-esq, canto inf-dir) | `10,5,20,15` |
| `poly` | `x1,y1,x2,y2,...,xn,yn` | `50,50,100,100,150,50` |
| `default` | (nenhum) | ocupa a imagem inteira |

## Regras e Boas Práticas

1. **`alt` no `<img>`**: Se a imagem é apenas navegação, use `alt=""` e coloque `alt` descritivo em cada `<area>`
2. **Ordem dos `<area>`**: Deve corresponder à ordem visual dos hotspots (navegação por teclado)
3. **Hotspots grandes**: Mínimo 72x72 CSS pixels para touch targets, com gaps generosos
4. **Responsividade**: Image maps não escalam automaticamente. Coordenadas fixas quebram em viewports menores
5. **Um `<map>` por `<img>`**: Múltiplas imagens com o mesmo `usemap` causam comportamento imprevisível entre browsers
6. **Acessibilidade**: Testar com teclado e leitor de tela; cada `<area>` deve ser acessível via Tab

## Exemplo Completo

```html
<img src="world-map.png" usemap="#world-map" alt="Mapa mundial" />

<map name="world-map">
  <area shape="rect" coords="0,0,200,200"
        href="/americas" alt="Américas" />
  <area shape="rect" coords="200,0,400,200"
        href="/europe-africa" alt="Europa e África" />
  <area shape="rect" coords="400,0,600,200"
        href="/asia" alt="Ásia" />
</map>
```

> [!NOTE]
> Para image maps responsivos, é necessário JavaScript para recalcular coordenadas proporcionalmente ao viewport, ou usar bibliotecas como [Image Map Resizer](https://github.com/davidjbradshaw/image-map-resizer).
