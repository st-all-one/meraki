# Task Manager HTML Puro — Implementação Completa

Este arquivo implementa um gerenciador de tarefas completo estilo TickTick usando apenas HTML + daisyUI (CDN). Sem framework JS — ideal para prototipação ou projetos server-side (Rust, PHP, etc.).

## Estrutura de Arquivos

```
task-manager/
├── index.html        # App completo em página única
├── input.css         # (se usar CLI) Config Tailwind + daisyUI
└── output.css        # (se usar CLI) CSS compilado
```

## `index.html` — Completo

```html
<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Manager</title>

  <!-- CDN daisyUI + Tailwind (troque por output.css em produção) -->
  <link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

  <style>
    /* Customizações adicionais */
    .task-item {
      transition: background-color 0.15s ease;
    }
    .task-item .actions {
      visibility: hidden;
    }
    .task-item:hover .actions {
      visibility: visible;
    }
    .task-done p {
      text-decoration: line-through;
      opacity: 0.5;
    }
  </style>
</head>
<body class="min-h-screen bg-base-200">
  <!-- ========== DRAWER (Sidebar + Conteúdo) ========== -->
  <div class="drawer lg:drawer-open">
    <input id="sidebar-toggle" type="checkbox" class="drawer-toggle" />

    <!-- ===== DRAWER CONTENT ===== -->
    <div class="drawer-content flex flex-col">
      <!-- Navbar -->
      <header class="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-30 shadow-xs">
        <div class="flex-none lg:hidden">
          <label for="sidebar-toggle" class="btn btn-ghost btn-square drawer-button">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
          </label>
        </div>
        <div class="flex-1">
          <input type="search" placeholder="Search tasks..." class="input input-sm input-ghost w-full max-w-sm" />
        </div>
        <div class="flex-none gap-1">
          <button class="btn btn-ghost btn-sm btn-square" onclick="toggleTheme()">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>
          <details class="dropdown dropdown-end">
            <summary class="btn btn-ghost btn-circle avatar">
              <div class="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">U</div>
            </summary>
            <ul class="menu dropdown-content bg-base-100 rounded-box z-30 mt-3 w-52 p-2 shadow-lg">
              <li><a>Settings</a></li>
              <li><a>Theme</a></li>
              <li class="menu-title">Theme</li>
              <li><a onclick="setTheme('light')">Light</a></li>
              <li><a onclick="setTheme('dark')">Dark</a></li>
              <li><a onclick="setTheme('cupcake')">Cupcake</a></li>
              <li><div class="divider my-0"></div></li>
              <li><a class="text-error">Logout</a></li>
            </ul>
          </details>
        </div>
      </header>

      <!-- Grid 3 colunas -->
      <div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 57px);">
        <!-- Coluna 2: Lista de Tarefas -->
        <main class="flex-1 overflow-y-auto p-4 lg:p-6">
          <!-- Cabeçalho da lista -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold">Today</h2>
              <p class="text-sm text-base-content/60">Sun, Jul 17 — 5 tasks</p>
            </div>
            <button class="btn btn-primary" onclick="newTaskModal.showModal()">+ New Task</button>
          </div>

          <!-- Filtros rápidos -->
          <div class="join mb-4">
            <button class="join-item btn btn-sm btn-active">All</button>
            <button class="join-item btn btn-sm">Pending</button>
            <button class="join-item btn btn-sm">Completed</button>
          </div>

          <!-- Items de tarefa -->
          <div class="space-y-1" id="task-list">
            <!-- Gerado dinamicamente via JS, mas com fallback estático -->
          </div>
        </main>

        <!-- Coluna 3: Detalhes da Tarefa -->
        <aside class="hidden lg:block w-96 border-l border-base-300 overflow-y-auto p-6" id="detail-panel">
          <div class="flex flex-col items-center justify-center h-full text-center text-base-content/40">
            <svg class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-sm">Select a task to see details</p>
          </div>
        </aside>
      </div>
    </div>

    <!-- ===== DRAWER SIDEBAR ===== -->
    <aside class="drawer-side z-20">
      <label for="sidebar-toggle" class="drawer-overlay"></label>
      <div class="bg-base-200 text-base-content min-h-full w-64 p-4 flex flex-col">
        <div class="mb-6 px-2">
          <h1 class="text-xl font-bold">Task Manager</h1>
        </div>

        <ul class="menu px-0 gap-1">
          <li><a class="active" onclick="selectList(this, 'inbox')">
            <span class="text-base-content/60"><!-- inbox icon -->📥</span> Inbox
            <span class="badge badge-sm badge-soft">3</span>
          </a></li>
          <li><a onclick="selectList(this, 'today')">
            <span class="text-base-content/60">📅</span> Today
          </a></li>
          <li><a onclick="selectList(this, 'upcoming')">
            <span class="text-base-content/60">📆</span> Upcoming
          </a></li>
          <li><a onclick="selectList(this, 'completed')">
            <span class="text-base-content/60">✅</span> Completed
          </a></li>
        </ul>

        <div class="divider my-3"></div>

        <h3 class="menu-title px-2">Projects</h3>
        <ul class="menu px-0 gap-1" id="project-list">
          <li><a onclick="selectList(this, 'personal')">👤 Personal</a></li>
          <li><a onclick="selectList(this, 'work')">💼 Work</a></li>
        </ul>

        <div class="mt-auto pt-4">
          <button class="btn btn-ghost btn-sm w-full justify-start gap-2" onclick="addProjectModal.showModal()">
            <span class="text-lg leading-none">+</span> New List
          </button>
        </div>

        <!-- Theme toggle button -->
        <div class="pt-4 border-t border-base-300 mt-4">
          <label class="flex items-center justify-between px-2 py-1 cursor-pointer">
            <span class="text-sm">Dark mode</span>
            <input type="checkbox" class="toggle toggle-sm" onchange="toggleTheme()" />
          </label>
        </div>
      </div>
    </aside>
  </div>

  <!-- ========== MODALS ========== -->

  <!-- Modal: Nova Tarefa -->
  <dialog id="newTaskModal" class="modal">
    <div class="modal-box w-11/12 max-w-lg">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="text-lg font-bold mb-4">New Task</h3>
      <div class="space-y-4">
        <input type="text" placeholder="Task title" class="input input-bordered w-full" id="task-title-input" />
        <textarea class="textarea textarea-bordered w-full" placeholder="Description (optional)" rows="3" id="task-desc-input"></textarea>

        <div class="flex gap-4">
          <select class="select select-bordered flex-1" id="task-priority-input">
            <option value="priority-high">High</option>
            <option value="priority-medium" selected>Medium</option>
            <option value="priority-low">Low</option>
          </select>
          <select class="select select-bordered flex-1" id="task-list-input">
            <option value="inbox">Inbox</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="personal">Personal</option>
            <option value="work">Work</option>
          </select>
        </div>

        <input type="date" class="input input-bordered w-full" id="task-date-input" />

        <div class="modal-action">
          <button class="btn" onclick="newTaskModal.close()">Cancel</button>
          <button class="btn btn-primary" onclick="addTask()">Add Task</button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <!-- Modal: Detalhes (Mobile) -->
  <dialog id="detailModal" class="modal">
    <div class="modal-box w-11/12 max-w-lg">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <div id="detail-content">
        <!-- Preenchido via JS -->
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <!-- Modal: Novo Projeto -->
  <dialog id="addProjectModal" class="modal">
    <div class="modal-box w-11/12 max-w-sm">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="text-lg font-bold mb-4">New List</h3>
      <input type="text" placeholder="List name" class="input input-bordered w-full mb-4" id="project-name-input" />
      <div class="modal-action">
        <button class="btn" onclick="addProjectModal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="addProject()">Create</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <!-- Toast container -->
  <div class="toast toast-end toast-bottom z-50" id="toast-container"></div>

  <!-- ========== JAVASCRIPT ========== -->
  <script>
    // ---- Estado ----
    const state = {
      currentList: 'today',
      tasks: [
        { id: 1, title: 'Review project proposal', desc: 'Final review before client meeting', done: false, priority: 'high', list: 'today', date: '2026-07-17' },
        { id: 2, title: 'Buy groceries', desc: 'Milk, eggs, bread, vegetables', done: false, priority: 'medium', list: 'today', date: '2026-07-17' },
        { id: 3, title: 'Gym workout', desc: 'Leg day 🦵', done: true, priority: 'low', list: 'today', date: '2026-07-17' },
        { id: 4, title: 'Read chapter 5', desc: 'Rust book — ownership', done: false, priority: 'medium', list: 'personal', date: '2026-07-18' },
        { id: 5, title: 'Fix login bug', desc: 'Session timeout issue', done: false, priority: 'high', list: 'work', date: '2026-07-17' },
      ],
      nextId: 6,
    };

    // ---- Render ----
    function renderTasks() {
      const list = document.getElementById('task-list');
      const filtered = state.tasks.filter(t => t.list === state.currentList || state.currentList === 'all');
      list.innerHTML = filtered.map(t => renderTaskItem(t)).join('');
    }

    const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low' };
    const priorityClasses = { high: 'badge-error', medium: 'badge-warning', low: 'badge-soft' };

    function renderTaskItem(t) {
      return `
        <div class="task-item flex items-start gap-3 p-3 rounded-box hover:bg-base-200 cursor-pointer group ${t.done ? 'task-done' : ''}"
             onclick="showDetail(${t.id})">
          <input type="checkbox" class="checkbox checkbox-primary mt-0.5" ${t.done ? 'checked' : ''}
                 onclick="event.stopPropagation(); toggleDone(${t.id})" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">${t.title}</p>
            ${t.desc ? `<p class="text-sm text-base-content/50 truncate">${t.desc}</p>` : ''}
            <div class="flex gap-1 mt-1 flex-wrap">
              <span class="badge badge-xs ${priorityClasses[t.priority]}">${priorityLabels[t.priority]}</span>
              ${t.date ? `<span class="badge badge-xs badge-soft">${t.date}</span>` : ''}
            </div>
          </div>
          <div class="actions flex gap-1">
            <button class="btn btn-ghost btn-xs btn-square" onclick="event.stopPropagation(); deleteTask(${t.id})">
              <svg class="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }

    // ---- Detail Panel ----
    function showDetail(id) {
      const t = state.tasks.find(task => task.id === id);
      if (!t) return;

      const html = `
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <input type="checkbox" class="checkbox checkbox-primary" ${t.done ? 'checked' : ''}
                   onchange="toggleDone(${t.id})" />
            <h3 class="text-lg font-bold ${t.done ? 'line-through text-base-content/50' : ''}">${t.title}</h3>
          </div>
          <textarea class="textarea textarea-ghost w-full" placeholder="Add description..." rows="4"
                    onchange="updateTask(${t.id}, 'desc', this.value)">${t.desc || ''}</textarea>
          <div class="flex flex-wrap gap-2">
            <select class="select select-sm select-bordered" onchange="updateTask(${t.id}, 'priority', this.value)">
              <option value="high" ${t.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${t.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${t.priority === 'low' ? 'selected' : ''}>Low</option>
            </select>
            <select class="select select-sm select-bordered" onchange="updateTask(${t.id}, 'list', this.value)">
              <option value="inbox" ${t.list === 'inbox' ? 'selected' : ''}>Inbox</option>
              <option value="today" ${t.list === 'today' ? 'selected' : ''}>Today</option>
              <option value="upcoming" ${t.list === 'upcoming' ? 'selected' : ''}>Upcoming</option>
              <option value="personal" ${t.list === 'personal' ? 'selected' : ''}>Personal</option>
              <option value="work" ${t.list === 'work' ? 'selected' : ''}>Work</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-base-content/60 block mb-1">Due Date</label>
            <input type="date" class="input input-bordered input-sm w-full" value="${t.date || ''}"
                   onchange="updateTask(${t.id}, 'date', this.value)" />
          </div>
          <div class="flex gap-2 pt-2">
            <button class="btn btn-primary btn-sm flex-1" onclick="showToast('Task updated!', 'success')">Save</button>
            <button class="btn btn-ghost btn-sm text-error" onclick="deleteTask(${t.id})">Delete</button>
          </div>
        </div>
      `;

      const panel = document.getElementById('detail-panel');
      if (panel) {
        panel.innerHTML = html;
      }
      // Mobile: show in modal
      const modal = document.getElementById('detailModal');
      if (modal && window.innerWidth < 1024) {
        document.getElementById('detail-content').innerHTML = html;
        modal.showModal();
      }
    }

    // ---- CRUD ----
    function addTask() {
      const title = document.getElementById('task-title-input').value.trim();
      if (!title) { showToast('Title is required', 'error'); return; }

      state.tasks.push({
        id: state.nextId++,
        title,
        desc: document.getElementById('task-desc-input').value.trim(),
        done: false,
        priority: document.getElementById('task-priority-input').value,
        list: document.getElementById('task-list-input').value,
        date: document.getElementById('task-date-input').value,
      });

      document.getElementById('task-title-input').value = '';
      document.getElementById('task-desc-input').value = '';
      newTaskModal.close();
      renderTasks();
      showToast('Task created!', 'success');
    }

    function toggleDone(id) {
      const t = state.tasks.find(task => task.id === id);
      if (t) { t.done = !t.done; renderTasks(); }
    }

    function deleteTask(id) {
      state.tasks = state.tasks.filter(t => t.id !== id);
      renderTasks();
      showToast('Task deleted', 'info');
    }

    function updateTask(id, field, value) {
      const t = state.tasks.find(task => task.id === id);
      if (t) { t[field] = value; }
    }

    // ---- UI ----
    function selectList(el, id) {
      document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
      el.classList.add('active');
      state.currentList = id;
      renderTasks();
    }

    function addProject() {
      const name = document.getElementById('project-name-input').value.trim();
      if (!name) return;
      const el = document.createElement('li');
      const id = 'project-' + Date.now();
      el.innerHTML = `<a onclick="selectList(this, '${id}')">📁 ${name}</a>`;
      document.getElementById('project-list').appendChild(el);
      addProjectModal.close();
      document.getElementById('project-name-input').value = '';
    }

    // ---- Toast ----
    function showToast(msg, type = 'info') {
      const container = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = `alert alert-${type} shadow-lg`;
      el.innerHTML = `<span>${msg}</span>`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }

    // ---- Theme ----
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    }

    function setTheme(name) {
      document.documentElement.setAttribute('data-theme', name);
    }

    // ---- Init ----
    renderTasks();
    // Set default active list
    document.querySelector('.menu a.active')?.classList.remove('active');
    document.querySelector('.menu a[onclick*="today"]')?.classList.add('active');
  </script>
</body>
</html>
```

## Resumo dos Componentes daisyUI Usados

| Componente | Classe | Função |
|---|---|---|
| Drawer | `.drawer .drawer-content .drawer-side .drawer-toggle .drawer-overlay` | Sidebar responsiva |
| Navbar | `.navbar` | Barra superior |
| Button | `.btn .btn-primary .btn-ghost .btn-sm .btn-square .btn-circle` | Ações |
| Input | `.input .input-sm .input-ghost .input-bordered` | Formulários |
| Badge | `.badge .badge-error .badge-warning .badge-soft .badge-xs` | Tags e status |
| Checkbox | `.checkbox .checkbox-primary` | Concluir tarefa |
| Select | `.select .select-bordered .select-sm` | Dropdowns de seleção |
| Textarea | `.textarea .textarea-ghost .textarea-bordered` | Descrição |
| Modal | `.modal .modal-box .modal-backdrop` | Diálogos |
| Toast | `.toast .alert` | Notificações |
| Dropdown | `.dropdown .dropdown-content .dropdown-end` | Menu do usuário |
| Menu | `.menu .menu-title` | Sidebar de navegação |
| Join | `.join .join-item` | Filtros agrupados |
| Divider | `.divider` | Separadores |
| Toggle | `.toggle` | Dark mode switch |
