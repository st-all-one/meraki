# Transformações 2D e 3D

## Conceito

`transform` modifica a **aparência visual** de um elemento sem afetar o fluxo do layout. Operações como rotacionar, escalar, mover ou inclinar são feitas na camada de composite — sem disparar reflow.

## Transform 2D

### translate() — Movimento

```css
.elemento {
  transform: translateX(20px);           /* move 20px para direita */
  transform: translateY(-10px);          /* move 10px para cima */

  transform: translate(20px, -10px);    /* x, y */
  transform: translate(50%);             /* 50% da própria largura */
  transform: translate(20px);            /* mesmo valor para x e y */

  /* Centralização clássica */
  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);   /* centraliza baseado no próprio tamanho */
  }
}
```

### scale() — Escala

```css
.elemento {
  transform: scale(1.5);              /* 150% do tamanho original */
  transform: scaleX(2);               /* dobra largura */
  transform: scaleY(0.5);             /* metade altura */

  transform: scale(1.2, 0.8);         /* x: 120%, y: 80% */

  /* Hover sutil */
  .card:hover { transform: scale(1.02); }

  /* Active click */
  .btn:active { transform: scale(0.97); }
}
```

### rotate() — Rotação

```css
.elemento {
  transform: rotate(45deg);            /* 45 graus horário */
  transform: rotate(-90deg);           /* 90 graus anti-horário */
  transform: rotate(0.5turn);          /* meia volta */
  transform: rotate(1.57rad);          /* radianos */
}
```

### skew() — Inclinação

```css
.elemento {
  transform: skewX(10deg);             /* inclina horizontal */
  transform: skewY(5deg);              /* inclina vertical */
  transform: skew(10deg, 5deg);        /* x, y */
}
```

### Múltiplas Transformações

```css
/* Ordem importa — aplica da DIREITA para ESQUERDA */
.elemento {
  transform: translateX(100px) rotate(45deg) scale(1.2);
  /* 1. scale(1.2), 2. rotate(45deg), 3. translateX(100px) */
}

/* ❌ Problema: overwrite */
.elemento {
  transform: translateX(20px);
  transform: rotate(45deg);            /* sobrescreve translate */
}

/* ✅ Correto: combinar */
.elemento {
  transform: translateX(20px) rotate(45deg);
}
```

## transform-origin — Ponto de Origem

```css
.elemento {
  transform-origin: center;            /* centro (padrão) */
  transform-origin: top left;          /* canto superior esquerdo */
  transform-origin: 0 0;               /* pixels */
  transform-origin: 50% 50%;           /* centro (padrão) */
  transform-origin: right bottom;      /* canto inferior direito */
}

/* Rotação a partir do canto */
.elemento:hover {
  transform-origin: top left;
  transform: rotate(10deg);
}
```

## Transform 3D

### perspective — Profundidade

```css
/* No container: define a perspectiva para todos os filhos */
.container-3d {
  perspective: 800px;                  /* distância do observador */
  perspective-origin: center;          /* ponto de vista */
}

/* Ou diretamente no elemento */
.elemento {
  transform: perspective(800px) rotateY(45deg);
}
```

### rotateX / rotateY / rotateZ

```css
.elemento {
  transform: rotateX(45deg);           /* inclina para frente/trás */
  transform: rotateY(45deg);           /* gira para esquerda/direita */
  transform: rotateZ(45deg);           /* igual a rotate() — 2D */
  transform: rotate3d(1, 1, 0, 45deg); /* eixo personalizado */
}
```

### translateZ

```css
.elemento {
  transform: perspective(800px) translateZ(100px);  /* aproxima */
  transform: perspective(800px) translateZ(-100px); /* afasta */
}
```

### scaleZ

```css
.elemento {
  transform: perspective(800px) scaleZ(1.5) rotateX(45deg);
}
```

### transform-style: preserve-3d

```css
/* Preserva o espaço 3D para filhos */
.card-3d {
  transform-style: preserve-3d;        /* padrão: flat */
  perspective: 800px;
}

.card-3d:hover {
  transform: rotateY(15deg);
}

.card-3d-child {
  transform: translateZ(30px);         /* funciona em 3D */
}
```

### backface-visibility

```css
/* Esconde a "parte de trás" do elemento */
.flip-card {
  backface-visibility: hidden;
}

/* Flip card */
.card-front,
.card-back {
  backface-visibility: hidden;
  position: absolute;
}

.card-back {
  transform: rotateY(180deg);          /* começa virado */
}

.card-inner:hover {
  transform: rotateY(180deg);          /* gira o card */
}
```

### Transform 3D Completo

```css
.card-container {
  perspective: 1000px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.card-container:hover .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
```

## Performance

```css
/* ✅ Transform — composite, sem reflow */
.elemento {
  transition: transform 0.3s ease;
}
.elemento:hover { transform: translateX(20px); }

/* ❌ Propriedade de layout — dispara reflow */
.elemento {
  transition: left 0.3s ease;
}
.elemento:hover { left: 20px; }
```

### Hierarquia de Performance

| Transformação | Pipeline | Custo |
|---|---|---|
| `translate` | Composite | ✅ Baixo |
| `rotate` | Composite | ✅ Baixo |
| `scale` | Composite | ✅ Baixo |
| `skew` | Composite | ✅ Baixo |
| `translateZ` | Composite | ✅ Baixo |
| `perspective()` | Composite | ✅ Baixo |
| `rotateX`/`rotateY` | Composite | ✅ Baixo |

## Casos de Uso Comuns

### Hover Elevation

```css
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
}
```

### Click Feedback

```css
.btn {
  transition: transform 0.1s ease;
}

.btn:active {
  transform: scale(0.97);
}
```

### Loading Spinner

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 0.8s linear infinite;
}
```

### Skeleton Shimmer

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.3), transparent);
  animation: shimmer 1.5s infinite;
}
```

### Modal Entrance

```css
.modal {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal.open {
  transform: scale(1) translateY(0);
  opacity: 1;
}
```

## Propriedades Relacionadas

### translate — Propriedade Independente

```css
/* Propriedade independente (não substitui transform) */
.elemento {
  translate: 20px 10px;
  /* equivalente a transform: translate(20px, 10px) */
}
```

### rotate — Propriedade Independente

```css
.elemento {
  rotate: 45deg;
  /* equivalente a transform: rotate(45deg) */
}
```

### scale — Propriedade Independente

```css
.elemento {
  scale: 1.5;
  /* equivalente a transform: scale(1.5) */
}
```

**Vantagem**: podem ser animadas independentemente sem overwrite:

```css
.elemento {
  translate: 0;
  scale: 1;
  rotate: 0;
  transition: translate 0.3s, scale 0.2s;
}

.elemento:hover {
  translate: 0 -4px;
  scale: 1.02;
}
```

## will-change — Otimização

```css
.elemento {
  will-change: transform;     /* promove para GPU layer */
}

/* ⚠️ Usar apenas sob interação iminente, não permanentemente */
.btn:hover {
  will-change: transform;     /* correto: só quando usuário vai interagir */
}
```

## Tabela de Funções de Transform

| Função | Descrição | Exemplo |
|---|---|---|
| `translate(x, y)` | Move elemento | `translate(20px, -10px)` |
| `translateX(x)` | Move horizontal | `translateX(50%)` |
| `translateY(y)` | Move vertical | `translateY(20px)` |
| `translateZ(z)` | Move profundidade (3D) | `translateZ(100px)` |
| `scale(x, y)` | Escala | `scale(1.5)` |
| `scaleX(x)` | Escala horizontal | `scaleX(2)` |
| `scaleY(y)` | Escala vertical | `scaleY(0.5)` |
| `rotate(a)` | Rotaciona | `rotate(45deg)` |
| `rotateX(a)` | Rotaciona X (3D) | `rotateX(30deg)` |
| `rotateY(a)` | Rotaciona Y (3D) | `rotateY(45deg)` |
| `skew(x, y)` | Inclina | `skew(10deg, 5deg)` |
| `matrix(a,b,c,d,e,f)` | Matriz 2D | `matrix(1,0,0,1,0,0)` |
| `perspective(d)` | Profundidade | `perspective(800px)` |

## Checklist

- [ ] `transform` para movimento em vez de `top`/`left`/`margin`
- [ ] Múltiplas transformações em uma única declaração (sem overwrite)
- [ ] `transform-origin` ajustado quando necessário (não só center)
- [ ] `preserve-3d` para efeitos 3D com filhos
- [ ] `backface-visibility: hidden` em flip cards
- [ ] `perspective` no container (não no elemento) para 3D natural
- [ ] `will-change: transform` apenas sob interação iminente
- [ ] Propriedades independentes (`translate`, `rotate`, `scale`) para animações simultâneas
- [ ] `prefers-reduced-motion` respeitado em transformações animadas
