# Task Manager em Rust Leptos 0.8+ — Implementação Completa

## Estrutura do Projeto

```
task-manager-leptos/
├── Cargo.toml
├── index.html              # (CSR) Trunk entry
├── input.css               # Tailwind + daisyUI
├── output.css              # Compilado
├── package.json            # Tailwind CLI + daisyUI
├── Trunk.toml              # (CSR) Hook pre-build
├── src/
│   ├── main.rs             # Entry point
│   ├── app.rs              # Componente raiz
│   ├── models.rs           # Tipos de dados
│   ├── components/
│   │   ├── sidebar.rs      # Drawer sidebar
│   │   ├── navbar.rs       # Navbar superior
│   │   ├── task_list.rs    # Lista de tarefas
│   │   ├── task_item.rs    # Item de tarefa
│   │   ├── detail_panel.rs # Painel de detalhes
│   │   ├── new_task_modal.rs
│   │   └── toast.rs        # Notificações
│   └── state.rs            # Estado global reativo
```

---

## Setup

### `Cargo.toml`

```toml
[package]
name = "task-manager"
version = "0.1.0"
edition = "2024"

[dependencies]
leptos = "0.8"
console_error_panic_hook = "0.1"
serde = { version = "1", features = ["derive"] }
wasm-bindgen = "0.2"
```

### `input.css`

```css
@import "tailwindcss";
@source "../**/*.html";
@source "../**/*.rs";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

### `Trunk.toml`

```toml
[[hooks]]
stage = "pre_build"
command = "npx"
command_arguments = ["tailwindcss", "-i", "input.css", "-o", "output.css"]
```

### `index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Manager</title>
  <link data-trunk rel="css" href="output.css" />
</head>
<body class="min-h-screen bg-base-200"></body>
</html>
```

---

## Código Fonte

### `src/main.rs`

```rust
use leptos::prelude::*;

mod app;
mod components;
mod models;
mod state;

fn main() {
    console_error_panic_hook::set_once();
    leptos::mount::mount_to_body(|| view! { <app::App/> });
}
```

### `src/models.rs`

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Priority {
    High,
    Medium,
    Low,
}

impl Priority {
    pub fn as_str(&self) -> &'static str {
        match self {
            Priority::High => "High",
            Priority::Medium => "Medium",
            Priority::Low => "Low",
        }
    }

    pub fn badge_class(&self) -> &'static str {
        match self {
            Priority::High => "badge-error",
            Priority::Medium => "badge-warning",
            Priority::Low => "badge-soft",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Task {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub done: bool,
    pub priority: Priority,
    pub list: String,
    pub date: String,
}
```

### `src/state.rs`

```rust
use leptos::prelude::*;
use crate::models::{Priority, Task};

#[derive(Clone, Default)]
pub struct AppState {
    pub tasks: RwSignal<Vec<Task>>,
    pub current_list: RwSignal<String>,
    pub next_id: RwSignal<u32>,
    pub selected_task: RwSignal<Option<u32>>,
    pub toast_message: RwSignal<Option<(String, String)>>,
}

impl AppState {
    pub fn new() -> Self {
        let state = AppState::default();
        state.next_id.set(6);
        state.tasks.set(vec![
            Task { id: 1, title: "Review project proposal".into(), description: "Final review before client meeting".into(), done: false, priority: Priority::High, list: "today".into(), date: "2026-07-17".into() },
            Task { id: 2, title: "Buy groceries".into(), description: "Milk, eggs, bread, vegetables".into(), done: false, priority: Priority::Medium, list: "today".into(), date: "2026-07-17".into() },
            Task { id: 3, title: "Gym workout".into(), description: "Leg day 🦵".into(), done: true, priority: Priority::Low, list: "today".into(), date: "2026-07-17".into() },
            Task { id: 4, title: "Read chapter 5".into(), description: "Rust book — ownership".into(), done: false, priority: Priority::Medium, list: "personal".into(), date: "2026-07-18".into() },
            Task { id: 5, title: "Fix login bug".into(), description: "Session timeout issue".into(), done: false, priority: Priority::High, list: "work".into(), date: "2026-07-17".into() },
        ]);
        state
    }

    pub fn filtered_tasks(&self) -> Vec<Task> {
        let current = self.current_list.get();
        self.tasks
            .get()
            .into_iter()
            .filter(|t| t.list == current || current == "all")
            .collect()
    }

    pub fn add_task(&self, title: String, desc: String, priority: Priority, list: String, date: String) {
        let id = {
            let mut next = self.next_id.write();
            let id = *next;
            *next += 1;
            id
        };
        self.tasks.update(|tasks| {
            tasks.push(Task { id, title, description: desc, done: false, priority, list, date });
        });
    }

    pub fn toggle_done(&self, id: u32) {
        self.tasks.update(|tasks| {
            if let Some(task) = tasks.iter_mut().find(|t| t.id == id) {
                task.done = !task.done;
            }
        });
    }

    pub fn delete_task(&self, id: u32) {
        self.tasks.update(|tasks| tasks.retain(|t| t.id != id));
    }

    pub fn update_task(&self, id: u32, field: &str, value: String) {
        self.tasks.update(|tasks| {
            if let Some(task) = tasks.iter_mut().find(|t| t.id == id) {
                match field {
                    "title" => task.title = value,
                    "description" => task.description = value,
                    "priority" => task.priority = serde_json::from_str(&format!("\"{}\"", value)).unwrap_or(Priority::Medium),
                    "list" => task.list = value,
                    "date" => task.date = value,
                    _ => {}
                }
            }
        });
    }

    pub fn show_toast(&self, msg: &str, typ: &str) {
        self.toast_message.set(Some((msg.to_string(), typ.to_string())));
        // Auto-clear depois de 2.5s
        leptos::task::spawn_local(async {
            leptos::leptos_dom::helpers::set_timeout(
                || { self.toast_message.set(None); },
                std::time::Duration::from_millis(2500),
            );
        });
    }
}
```

### `src/components/mod.rs`

```rust
pub mod sidebar;
pub mod navbar;
pub mod task_list;
pub mod task_item;
pub mod detail_panel;
pub mod new_task_modal;
pub mod toast;
```

### `src/components/sidebar.rs`

```rust
use leptos::prelude::*;
use crate::state::AppState;

#[component]
pub fn Sidebar(state: AppState) -> impl IntoView {
    let current = state.current_list;

    let select_list = move |list: &'static str| {
        let list = list.to_string();
        move |_| {
            state.current_list.set(list.clone());
            state.selected_task.set(None);
        }
    };

    view! {
        <aside class="drawer-side z-20">
            <label for="sidebar-toggle" class="drawer-overlay"></label>
            <div class="bg-base-200 text-base-content min-h-full w-64 p-4 flex flex-col">
                <div class="mb-6 px-2">
                    <h1 class="text-xl font-bold">"Task Manager"</h1>
                </div>

                <ul class="menu px-0 gap-1">
                    <li>
                        <a class=move || if current.get() == "inbox" { "active" } else { "" }
                           on:click=select_list("inbox")>
                            <span class="text-base-content/60">"📥"</span> " Inbox"
                        </a>
                    </li>
                    <li>
                        <a class=move || if current.get() == "today" { "active" } else { "" }
                           on:click=select_list("today")>
                            <span class="text-base-content/60">"📅"</span> " Today"
                        </a>
                    </li>
                    <li>
                        <a class=move || if current.get() == "upcoming" { "active" } else { "" }
                           on:click=select_list("upcoming")>
                            <span class="text-base-content/60">"📆"</span> " Upcoming"
                        </a>
                    </li>
                    <li>
                        <a class=move || if current.get() == "completed" { "active" } else { "" }
                           on:click=select_list("completed")>
                            <span class="text-base-content/60">"✅"</span> " Completed"
                        </a>
                    </li>
                </ul>

                <div class="divider my-3"></div>
                <h3 class="menu-title px-2">"Projects"</h3>
                <ul class="menu px-0 gap-1">
                    <li>
                        <a class=move || if current.get() == "personal" { "active" } else { "" }
                           on:click=select_list("personal")>
                            "👤 Personal"
                        </a>
                    </li>
                    <li>
                        <a class=move || if current.get() == "work" { "active" } else { "" }
                           on:click=select_list("work")>
                            "💼 Work"
                        </a>
                    </li>
                </ul>

                <div class="mt-auto pt-4">
                    <label for="project-modal-toggle"
                           class="btn btn-ghost btn-sm w-full justify-start gap-2">
                        <span class="text-lg leading-none">"+"</span> " New List"
                    </label>
                </div>
            </div>
        </aside>
    }
}
```

### `src/components/navbar.rs`

```rust
use leptos::prelude::*;

#[component]
pub fn Navbar() -> impl IntoView {
    view! {
        <header class="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-30 shadow-xs">
            <div class="flex-none lg:hidden">
                <label for="sidebar-toggle" class="btn btn-ghost btn-square drawer-button">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M4 6h16M4 12h16M4 18h7"/>
                    </svg>
                </label>
            </div>
            <div class="flex-1">
                <input type="search" placeholder="Search tasks..."
                       class="input input-sm input-ghost w-full max-w-sm" />
            </div>
            <div class="flex-none gap-1">
                <details class="dropdown dropdown-end">
                    <summary class="btn btn-ghost btn-circle avatar">
                        <div class="w-8 rounded-full bg-primary text-primary-content
                                    flex items-center justify-center text-sm font-bold">
                            "U"
                        </div>
                    </summary>
                    <ul class="menu dropdown-content bg-base-100 rounded-box z-30 mt-3 w-52 p-2 shadow-lg">
                        <li><a>"Settings"</a></li>
                        <li><a>"Logout"</a></li>
                    </ul>
                </details>
            </div>
        </header>
    }
}
```

### `src/components/task_item.rs`

```rust
use leptos::prelude::*;
use crate::models::Task;
use crate::state::AppState;

#[component]
pub fn TaskItem(task: Task, state: AppState) -> impl IntoView {
    let task_id = task.id;
    let done = task.done;
    let title = task.title.clone();
    let desc = task.description.clone();
    let priority = task.priority.clone();
    let date = task.date.clone();

    let toggle = move |_| state.toggle_done(task_id);
    let delete = move |_| {
        state.delete_task(task_id);
        state.show_toast("Task deleted", "info");
    };
    let select = move |_| {
        state.selected_task.set(Some(task_id));
    };

    view! {
        <div class="task-item flex items-start gap-3 p-3 rounded-box hover:bg-base-200 cursor-pointer group"
             class=("task-done", move || done)
             on:click=select>
            <input type="checkbox" class="checkbox checkbox-primary mt-0.5"
                   prop:checked=done
                   on:click=move |ev| { ev.stop_propagation(); toggle(()); } />
            <div class="flex-1 min-w-0">
                <p class=move || if done { "font-medium truncate line-through opacity-50" } else { "font-medium truncate" }>
                    {title.clone()}
                </p>
                <Show when=move || !desc.is_empty()>
                    <p class="text-sm text-base-content/50 truncate">{desc.clone()}</p>
                </Show>
                <div class="flex gap-1 mt-1 flex-wrap">
                    <span class=format!("badge badge-xs {}", priority.badge_class())>
                        {priority.as_str()}
                    </span>
                    <Show when=move || !date.is_empty()>
                        <span class="badge badge-xs badge-soft">{date.clone()}</span>
                    </Show>
                </div>
            </div>
            <div class="actions flex gap-1 opacity-0 group-hover:opacity-100">
                <button class="btn btn-ghost btn-xs btn-square" on:click=delete>
                    <svg class="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
    }
}
```

### `src/components/task_list.rs`

```rust
use leptos::prelude::*;
use crate::state::AppState;
use crate::components::task_item::TaskItem;

#[component]
pub fn TaskList(state: AppState) -> impl IntoView {
    let tasks = move || state.filtered_tasks();

    view! {
        <main class="flex-1 overflow-y-auto p-4 lg:p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-bold">{move || state.current_list.get()}</h2>
                    <p class="text-sm text-base-content/60">
                        {move || format!("{} tasks", tasks().len())}
                    </p>
                </div>
                <button class="btn btn-primary" on:click=|_| {
                    let el = document().get_element_by_id("new-task-modal")
                        .and_then(|el| el.dyn_into::<web_sys::HtmlDialogElement>().ok());
                    if let Some(dialog) = el { let _ = dialog.show_modal(); }
                }>"+ New Task"</button>
            </div>

            <div class="join mb-4">
                <button class="join-item btn btn-sm btn-active">"All"</button>
                <button class="join-item btn btn-sm">"Pending"</button>
                <button class="join-item btn btn-sm">"Completed"</button>
            </div>

            <div class="space-y-1">
                <For each=tasks key=|t| t.id children=move |task| {
                    view! { <TaskItem task state /> }
                }/>
            </div>
        </main>
    }
}
```

### `src/components/detail_panel.rs`

```rust
use leptos::prelude::*;
use crate::state::AppState;

#[component]
pub fn DetailPanel(state: AppState) -> impl IntoView {
    let selected = state.selected_task;
    let all_tasks = state.tasks;

    let task = move || {
        selected.get().and_then(|id| {
            all_tasks.get().into_iter().find(|t| t.id == id)
        })
    };

    view! {
        <aside class="hidden lg:block w-96 border-l border-base-300 overflow-y-auto p-6">
            {move || task().map(|t| {
                let task_id = t.id;
                let tt = t.clone();
                view! {
                    <div class="space-y-4">
                        <div class="flex items-center gap-2">
                            <input type="checkbox" class="checkbox checkbox-primary"
                                   prop:checked=t.done
                                   on:click=move |_| state.toggle_done(task_id) />
                            <h3 class="text-lg font-bold"
                                class:line-through=t.done
                                class:opacity-50=t.done>
                                {t.title}
                            </h3>
                        </div>

                        <textarea class="textarea textarea-ghost w-full"
                                  placeholder="Add description..."
                                  rows="4"
                                  prop:value=t.description
                                  on:input:target=move |ev|
                                      state.update_task(task_id, "description", ev.target().value())>
                        </textarea>

                        <div class="flex flex-wrap gap-2">
                            <select class="select select-sm select-bordered"
                                    on:change:target=move |ev|
                                        state.update_task(task_id, "priority", ev.target().value())>
                                <option value="high" selected=tt.priority.as_str() == "High">"High"</option>
                                <option value="medium" selected=tt.priority.as_str() == "Medium">"Medium"</option>
                                <option value="low" selected=tt.priority.as_str() == "Low">"Low"</option>
                            </select>
                        </div>

                        <div>
                            <label class="text-sm text-base-content/60 block mb-1">"Due Date"</label>
                            <input type="date" class="input input-bordered input-sm w-full"
                                   prop:value=t.date
                                   on:change:target=move |ev|
                                       state.update_task(task_id, "date", ev.target().value()) />
                        </div>

                        <div class="flex gap-2 pt-2">
                            <button class="btn btn-primary btn-sm flex-1"
                                    on:click=move |_| state.show_toast("Task updated!", "success")>
                                "Save"
                            </button>
                            <button class="btn btn-ghost btn-sm text-error"
                                    on:click=move |_| state.delete_task(task_id)>
                                "Delete"
                            </button>
                        </div>
                    </div>
                }
            }).unwrap_or_else(|| {
                view! {
                    <div class="flex flex-col items-center justify-center h-full text-center text-base-content/40">
                        <svg class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        <p class="text-sm">"Select a task to see details"</p>
                    </div>
                }
            })}
        </aside>
    }
}
```

### `src/components/new_task_modal.rs`

```rust
use leptos::prelude::*;
use crate::models::Priority;
use crate::state::AppState;

#[component]
pub fn NewTaskModal(state: AppState) -> impl IntoView {
    let title = RwSignal::new(String::new());
    let desc = RwSignal::new(String::new());
    let priority = RwSignal::new(String::from("medium"));
    let list = RwSignal::new(String::from("today"));
    let date = RwSignal::new(String::new());

    let add = move |_| {
        let t = title.get().trim().to_string();
        if t.is_empty() { return; }

        let p = match priority.get().as_str() {
            "high" => Priority::High,
            "low" => Priority::Low,
            _ => Priority::Medium,
        };

        state.add_task(t, desc.get(), p, list.get(), date.get());

        title.set(String::new());
        desc.set(String::new());
        priority.set(String::from("medium"));
        list.set(String::from("today"));
        date.set(String::new());

        if let Some(dialog) = document().get_element_by_id("new-task-modal")
            .and_then(|el| el.dyn_into::<web_sys::HtmlDialogElement>().ok())
        {
            let _ = dialog.close();
        }
        state.show_toast("Task created!", "success");
    };

    view! {
        <dialog id="new-task-modal" class="modal">
            <div class="modal-box w-11/12 max-w-lg">
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">"✕"</button>
                </form>
                <h3 class="text-lg font-bold mb-4">"New Task"</h3>
                <div class="space-y-4">
                    <input type="text" placeholder="Task title"
                           class="input input-bordered w-full"
                           bind:value=title />

                    <textarea class="textarea textarea-bordered w-full"
                              placeholder="Description (optional)" rows="3"
                              bind:value=desc></textarea>

                    <div class="flex gap-4">
                        <select class="select select-bordered flex-1" bind:value=priority>
                            <option value="high">"High"</option>
                            <option value="medium" selected>"Medium"</option>
                            <option value="low">"Low"</option>
                        </select>
                        <select class="select select-bordered flex-1" bind:value=list>
                            <option value="inbox">"Inbox"</option>
                            <option value="today" selected>"Today"</option>
                            <option value="upcoming">"Upcoming"</option>
                            <option value="personal">"Personal"</option>
                            <option value="work">"Work"</option>
                        </select>
                    </div>

                    <input type="date" class="input input-bordered w-full" bind:value=date />

                    <div class="modal-action">
                        <button class="btn" formmethod="dialog">"Cancel"</button>
                        <button class="btn btn-primary" on:click=add>"Add Task"</button>
                    </div>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop"><button>"close"</button></form>
        </dialog>
    }
}
```

### `src/components/toast.rs`

```rust
use leptos::prelude::*;
use crate::state::AppState;

#[component]
pub fn Toast(state: AppState) -> impl IntoView {
    let message = state.toast_message;

    view! {
        <div class="toast toast-end toast-bottom z-50">
            {move || message.get().map(|(msg, typ)| {
                view! {
                    <div class=format!("alert alert-{} shadow-lg", typ)>
                        <span>{msg}</span>
                    </div>
                }
            })}
        </div>
    }
}
```

### `src/app.rs`

```rust
use leptos::prelude::*;
use crate::state::AppState;
use crate::components::{
    sidebar::Sidebar,
    navbar::Navbar,
    task_list::TaskList,
    detail_panel::DetailPanel,
    new_task_modal::NewTaskModal,
    toast::Toast,
};

#[component]
pub fn App() -> impl IntoView {
    let state = AppState::new();

    view! {
        <div class="drawer lg:drawer-open min-h-screen">
            <input id="sidebar-toggle" type="checkbox" class="drawer-toggle" />

            <div class="drawer-content flex flex-col">
                <Navbar />
                <div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 57px);">
                    <TaskList state />
                    <DetailPanel state />
                </div>
            </div>

            <Sidebar state />
        </div>

        <NewTaskModal state />
        <Toast state />
    }
}
```

---

## Executando

```bash
# Terminal 1: CSS watch
npx tailwindcss -i input.css -o output.css --watch

# Terminal 2: Trunk dev server
trunk serve --open
```

---

## Mapeamento HTML → Leptos

| HTML (daisyUI) | Leptos |
|---|---|
| `class="btn btn-primary"` | `class="btn btn-primary"` |
| `onclick="fn()"` | `on:click=\|_\| fn()` |
| `oninput` | `on:input:target=\|ev\| ...` |
| `onchange` | `on:change:target=\|ev\| ...` |
| `checked` | `prop:checked=true` |
| `value="x"` | `prop:value=x` |
| `bind:value` | `bind:value=signal` |
| `showModal()` | `web_sys::HtmlDialogElement::show_modal()` |
| `data-theme="dark"` | `<html data-theme="dark">` no `index.html` |
| `<input type="checkbox" class="drawer-toggle">` | `<input type="checkbox" class="drawer-toggle">` |
