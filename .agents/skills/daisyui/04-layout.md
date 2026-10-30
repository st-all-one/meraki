# Layout 3 Colunas (Estilo TickTick)

## Estrutura

```
┌──────────────────────────────────────────────────┐
│                   Navbar                          │
├──────────┬──────────────────────┬─────────────────┤
│          │                      │                 │
│ Sidebar  │    Lista de          │   Detalhes      │
│ (Lists,  │    Tarefas           │   da Tarefa     │
│  Tags,   │    (filtradas)       │   (selecionada) │
│  etc.)   │                      │                 │
│          │                      │                 │
│  w-64    │    flex-1            │   w-96          │
├──────────┴──────────────────────┴─────────────────┤
│              Status Bar                           │
└──────────────────────────────────────────────────┘
```

### Mobile (< lg)

```
┌──────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Drawer   │  │  Lista           │  │  Modal (full)    │
│ (hamburg)│  │  de Tarefas      │  │  Detalhes        │
└──────────┘  └──────────────────┘  └──────────────────┘
```

## Implementação HTML

```html
<div class="drawer lg:drawer-open min-h-screen">
  <!-- Checkbox oculto para controle do drawer -->
  <input id="sidebar-toggle" type="checkbox" class="drawer-toggle" />

  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <header class="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-30">
      <div class="flex-none lg:hidden">
        <label for="sidebar-toggle" class="btn btn-ghost btn-square drawer-button">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </label>
      </div>
      <div class="flex-1">
        <input type="search" placeholder="Search tasks..." class="input input-sm input-ghost w-full max-w-sm" />
      </div>
      <div class="flex-none gap-2">
        <button class="btn btn-ghost btn-square btn-sm">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
              U
            </div>
          </div>
          <ul class="dropdown-content menu bg-base-100 rounded-box z-30 mt-3 w-52 p-2 shadow-lg">
            <li><a>Settings</a></li>
            <li><a>Theme</a></li>
            <li><a>Logout</a></li>
          </ul>
        </div>
      </div>
    </header>

    <!-- Grid 3 colunas -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Coluna 2: Lista de Tarefas -->
      <main class="flex-1 overflow-y-auto p-4">
        <!-- Cabeçalho da lista -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">Today</h2>
          <button class="btn btn-primary btn-sm">+ Add Task</button>
        </div>

        <!-- Tarefa item -->
        <div class="task-item flex items-start gap-3 p-3 rounded-box hover:bg-base-200 cursor-pointer group">
          <input type="checkbox" class="checkbox checkbox-primary mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">Comprar mantimentos</p>
            <p class="text-sm text-base-content/60 truncate">Supermercado às 18h</p>
            <div class="flex gap-1 mt-1">
              <span class="badge badge-warning badge-xs">Média</span>
              <span class="badge badge-info badge-xs">Pessoal</span>
            </div>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="btn btn-ghost btn-xs btn-square">✏️</button>
            <button class="btn btn-ghost btn-xs btn-square text-error">🗑️</button>
          </div>
        </div>

        <!-- Repeat task-item for more tasks -->
      </main>

      <!-- Coluna 3: Detalhes (opcional, escondida em mobile) -->
      <aside class="hidden lg:block w-96 border-l border-base-300 overflow-y-auto p-4">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <input type="checkbox" class="checkbox checkbox-primary" checked />
            <h3 class="text-lg font-bold line-through text-base-content/50">Comprar mantimentos</h3>
          </div>
          <textarea class="textarea textarea-ghost w-full" placeholder="Add description..." rows="4">Supermercado às 18h</textarea>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-warning">Média</span>
            <span class="badge badge-info">Pessoal</span>
          </div>
          <div>
            <label class="text-sm text-base-content/60 block mb-1">Lista</label>
            <select class="select select-bordered select-sm w-full">
              <option>Today</option>
              <option>Upcoming</option>
              <option>Inbox</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-base-content/60 block mb-1">Due Date</label>
            <input type="date" class="input input-bordered input-sm w-full" />
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm flex-1">Save</button>
            <button class="btn btn-ghost btn-sm">Delete</button>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <!-- Sidebar (Coluna 1) -->
  <aside class="drawer-side z-20">
    <label for="sidebar-toggle" class="drawer-overlay"></label>
    <div class="bg-base-200 text-base-content min-h-full w-64 p-4 flex flex-col">
      <!-- Logo -->
      <div class="mb-6 px-2">
        <h1 class="text-lg font-bold">Task Manager</h1>
      </div>

      <!-- Menu principal -->
      <ul class="menu px-0 gap-1">
        <li><a><svg class="h-4 w-4">[icon]</svg>Inbox</a></li>
        <li><a class="active"><svg class="h-4 w-4">[icon]</svg>Today</a></li>
        <li><a><svg class="h-4 w-4">[icon]</svg>Upcoming</a></li>
        <li><a><svg class="h-4 w-4">[icon]</svg>Completed</a></li>
      </ul>

      <div class="divider my-3"></div>

      <!-- Projetos / Listas -->
      <h3 class="menu-title px-2">Projects</h3>
      <ul class="menu px-0 gap-1">
        <li><a><svg class="h-4 w-4">[icon]</svg>Personal</a></li>
        <li><a><svg class="h-4 w-4">[icon]</svg>Work</a></li>
      </ul>

      <div class="mt-auto pt-4">
        <button class="btn btn-ghost btn-sm w-full justify-start gap-2">
          <svg class="h-4 w-4">[icon]</svg>New List
        </button>
      </div>
    </div>
  </aside>
</div>
```

## Responsividade

| Tela | Sidebar | Lista | Detalhes |
|---|---|---|---|
| `>= lg (1024px)` | Visível (drawer-open) | flex-1 | w-96 |
| `md (768px)` | Drawer toggle | flex-1 | Escondido |
| `< md` | Drawer toggle | flex-1 | Modal |

### Classes Responsivas Chave

- `lg:drawer-open` — sidebar sempre visível em desktop
- `hidden lg:block` — coluna de detalhes só em desktop
- `lg:hidden` — botão hamburger só em mobile
- `drawer-overlay` — fecha drawer ao clicar fora
