# Componentes Essenciais para Task Manager

## Button

```html
<!-- Variantes -->
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-dash">Dash</button>

<!-- Tamanhos -->
<button class="btn btn-xs">XSmall</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-md">Medium</button>
<button class="btn btn-lg">Large</button>
<button class="btn btn-xl">XLarge</button>

<!-- Estados -->
<button class="btn" disabled>Disabled</button>
<button class="btn btn-active">Active</button>
<button class="btn btn-primary loading">Loading</button>
<button class="btn btn-block">Full Width</button>
<button class="btn btn-circle btn-sm">X</button>
<button class="btn btn-square">+</button>
```

## Input / Textarea / Select

```html
<!-- Input simples -->
<input type="text" placeholder="Título da tarefa" class="input" />

<!-- Input com cores -->
<input type="text" class="input input-primary" />
<input type="text" class="input input-error" placeholder="Campo inválido" />

<!-- Input com label flutuante -->
<label class="floating-label">
  <span>Título</span>
  <input type="text" placeholder="Título" class="input" />
</label>

<!-- Textarea -->
<textarea class="textarea" placeholder="Descrição da tarefa"></textarea>

<!-- Select -->
<select class="select">
  <option>Alta</option>
  <option>Média</option>
  <option>Baixa</option>
</select>

<!-- Input com validator -->
<input type="email" class="input validator" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" />
<p class="validator-hint">Email inválido</p>
```

## Checkbox / Toggle / Radio

```html
<!-- Checkbox com cores -->
<input type="checkbox" class="checkbox" checked />
<input type="checkbox" class="checkbox checkbox-primary" />
<input type="checkbox" class="checkbox checkbox-secondary" />

<!-- Toggle (switch) -->
<input type="checkbox" class="toggle" />
<input type="checkbox" class="toggle toggle-primary" checked />

<!-- Radio -->
<input type="radio" name="priority" class="radio radio-primary" checked />
<input type="radio" name="priority" class="radio radio-warning" />
<input type="radio" name="priority" class="radio radio-error" />
```

## Card

```html
<div class="card bg-base-100 shadow-sm">
  <div class="card-body">
    <h2 class="card-title">Título da Tarefa</h2>
    <p>Descrição da tarefa aqui...</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Editar</button>
    </div>
  </div>
</div>
```

## Badge

```html
<span class="badge">Default</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-secondary">Secondary</span>
<span class="badge badge-accent">Accent</span>
<span class="badge badge-outline">Outline</span>
<span class="badge badge-success">Feito</span>
<span class="badge badge-warning">Pendente</span>
<span class="badge badge-error">Atrasado</span>
<span class="badge badge-info">Info</span>
<span class="badge badge-neutral">Neutral</span>

<!-- Tamanhos -->
<span class="badge badge-xs">xs</span>
<span class="badge badge-sm">sm</span>
<span class="badge badge-md">md</span>
<span class="badge badge-lg">lg</span>
<span class="badge badge-xl">xl</span>
```

## Drawer (Sidebar)

```html
<div class="drawer lg:drawer-open">
  <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="navbar bg-base-200 w-full">
      <label for="drawer-toggle" class="btn btn-ghost drawer-button lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </label>
      <span class="text-lg font-bold">Task Manager</span>
    </div>
    <!-- Conteúdo principal -->
    <div class="p-4">[Tarefas aqui]</div>
  </div>
  <div class="drawer-side">
    <label for="drawer-toggle" class="drawer-overlay"></label>
    <ul class="menu bg-base-200 text-base-content min-h-full w-64 p-4">
      <li><a>Inbox</a></li>
      <li><a>Today</a></li>
      <li><a>Upcoming</a></li>
      <li><a>Completed</a></li>
    </ul>
  </div>
</div>
```

## Modal (Dialog)

```html
<!-- Método 1: HTML dialog element (recomendado) -->
<button class="btn btn-primary" onclick="my_modal.showModal()">Nova Tarefa</button>
<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Nova Tarefa</h3>
    <input type="text" placeholder="Título" class="input input-bordered w-full mt-4" />
    <div class="modal-action">
      <button class="btn" onclick="my_modal.close()">Cancelar</button>
      <button class="btn btn-primary">Salvar</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<!-- Método 2: Dialog modal with custom width -->
<dialog id="my_modal" class="modal">
  <div class="modal-box w-11/12 max-w-2xl">...</div>
</dialog>

<!-- Método 3: Modal bottom sheet (mobile) -->
<dialog id="my_modal" class="modal">
  <div class="modal-box sm:modal-middle">...</div>
</dialog>
```

## Dropdown

```html
<!-- Método 1: details + summary (sem JS) -->
<details class="dropdown">
  <summary class="btn">Prioridade</summary>
  <ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
    <li><a>Alta</a></li>
    <li><a>Média</a></li>
    <li><a>Baixa</a></li>
  </ul>
</details>

<!-- Método 2: Popover API (recomendado para SPAs) -->
<div class="dropdown">
  <button class="btn" popovertarget="menu">Prioridade</button>
  <ul id="menu" class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm" popover>
    <li><a>Alta</a></li>
    <li><a>Média</a></li>
    <li><a>Baixa</a></li>
  </ul>
</div>
```

## Menu

```html
<ul class="menu bg-base-200 rounded-box w-64">
  <li><h2 class="menu-title">Lists</h2></li>
  <li><a>Inbox</a></li>
  <li><a class="active">Today</a></li>
  <li><a>Upcoming</a></li>
  <li><a>Completed</a></li>
  <li><h2 class="menu-title">Projects</h2></li>
  <li><a>Work</a></li>
  <li><a>Personal</a></li>
</ul>
```

## Toast / Alert

```html
<!-- Toast container (fixo no canto) -->
<div class="toast toast-end">
  <div class="alert alert-success">
    <span>Tarefa criada com sucesso!</span>
  </div>
</div>

<!-- Alert variantes -->
<div class="alert alert-info">Info</div>
<div class="alert alert-success">Success</div>
<div class="alert alert-warning">Warning</div>
<div class="alert alert-error">Error</div>

<!-- Alert com descrição -->
<div class="alert alert-success">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>Tarefa concluída!</span>
</div>
```

## Tooltip

```html
<button class="btn tooltip" data-tip="Clique para editar">Editar</button>

<!-- Posições -->
<button class="btn tooltip tooltip-top" data-tip="Top">Top</button>
<button class="btn tooltip tooltip-bottom" data-tip="Bottom">Bottom</button>
<button class="btn tooltip tooltip-left" data-tip="Left">Left</button>
<button class="btn tooltip tooltip-right" data-tip="Right">Right</button>

<!-- Tooltip com div (conteúdo customizado) -->
<div class="tooltip" data-tip="Detalhes da tarefa">
  <div class="tooltip-content">
    <span class="badge badge-primary">Tag</span>
  </div>
  <button class="btn">Hover</button>
</div>
```

## Indicator

```html
<div class="indicator">
  <span class="indicator-item badge badge-secondary">3</span>
  <div class="card bg-base-100 shadow-sm p-4">Inbox</div>
</div>
```

## Join (grupo de itens)

```html
<div class="join">
  <button class="btn join-item">Today</button>
  <button class="btn join-item btn-active">Week</button>
  <button class="btn join-item">Month</button>
</div>
```

## Tabs

```html
<div role="tablist" class="tabs tabs-bordered">
  <input type="radio" name="tab" class="tab" aria-label="Pendentes" checked />
  <div class="tab-content p-4">Tarefas pendentes...</div>
  <input type="radio" name="tab" class="tab" aria-label="Concluídas" />
  <div class="tab-content p-4">Tarefas concluídas...</div>
</div>
```

## Loading

```html
<span class="loading loading-spinner loading-lg"></span>
<span class="loading loading-dots loading-md"></span>
<span class="loading loading-ring loading-sm"></span>
<span class="loading loading-ball loading-xs"></span>
<span class="loading loading-bars loading-lg"></span>
<span class="loading loading-infinity loading-md"></span>
```

## Skeleton (loading state)

```html
<div class="space-y-4">
  <div class="skeleton h-8 w-full"></div>
  <div class="skeleton h-16 w-full"></div>
  <div class="skeleton h-8 w-3/4"></div>
</div>
```

## Swap (toggle ícone)

```html
<label class="swap swap-rotate">
  <input type="checkbox" />
  <svg class="swap-off h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/>
  </svg>
  <svg class="swap-on h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M4.2,4.2A1,1,0,0,0,2.8,5.6L7.17,10A3.94,3.94,0,0,0,6,13.5,6,6,0,0,0,18,18.83l2.38,2.38a1,1,0,0,0,1.42-1.42ZM12,6.5A5.54,5.54,0,0,1,17.5,12,5.44,5.44,0,0,1,17.13,14L14,10.87A3.44,3.44,0,0,0,12,6.5Z"/>
  </svg>
</label>
```

## Countdown

```html
<span class="countdown">
  <span style="--value: 2;">2</span>
  <span style="--value: 14;">14</span>
  <span style="--value: 35;">35</span>
</span>
<!-- Formato: 02:14:35 (horas:minutos:segundos) -->
```

## Diff (comparação before/after)

```html
<figure class="diff aspect-16/9">
  <div class="diff-item-1">
    <img alt="Before" src="before.jpg" />
  </div>
  <div class="diff-item-2">
    <img alt="After" src="after.jpg" />
  </div>
  <div class="diff-resizer"></div>
</figure>
```

## Stat

```html
<div class="stats shadow-sm">
  <div class="stat">
    <div class="stat-title">Tarefas Hoje</div>
    <div class="stat-value">12</div>
    <div class="stat-desc">3 concluídas</div>
  </div>
  <div class="stat">
    <div class="stat-title">Completas</div>
    <div class="stat-value text-success">8</div>
    <div class="stat-desc">↗︎ 40%</div>
  </div>
</div>
```

## Progress / Radial Progress

```html
<progress class="progress progress-primary w-56" value="60" max="100"></progress>
<progress class="progress progress-secondary w-56" value="40" max="100"></progress>
<progress class="progress progress-accent w-56" value="75" max="100"></progress>

<!-- Radial progress (precisa de JS para atualizar --value) -->
<div class="radial-progress text-primary" style="--value: 70;" role="progressbar">70%</div>
<div class="radial-progress text-success" style="--value: 80; --size: 6rem; --thickness: 8px;">80%</div>
```

## Calendar (Cally Web Component)

```html
<calendar-date class="cally"></calendar-date>
```

daisyUI inclui estilos para Cally, React Day Picker, e Vanilla Calendar Pro. Nenhum CSS extra necessário.

## Megamenu

```html
<div class="megamenu">
  <a class="btn">Projects</a>
  <div class="megamenu-dropdown max-w-2xl">
    <div class="grid grid-cols-3 gap-4 p-4">
      <div>
        <h3 class="mb-2 font-bold">Work</h3>
        <ul class="menu">
          <li><a>Project A</a></li>
          <li><a>Project B</a></li>
        </ul>
      </div>
      <div>
        <h3 class="mb-2 font-bold">Personal</h3>
        <ul class="menu">
          <li><a>Home</a></li>
          <li><a>Health</a></li>
        </ul>
      </div>
    </div>
  </div>
</div>
```
