import type { FC } from "hono/jsx";
import type { Actor, Role } from "@services/auth/contract.ts";
import { Page, roleLabel } from "@layout/views/page.tsx";
import { Field, Select } from "@layout/views/ui.tsx";

interface UserListRow {
  id: string;
  display_name: string;
  email: string;
  role: Role;
  active: number;
  created_at: string;
}

export const UsersPage: FC<{
  actor: Actor;
  unread: number;
  users: UserListRow[];
  created?: { name: string; email: string; password: string };
  error?: string;
  ok?: string;
}> = ({ actor, unread, users, created, error, ok }) => (
  <Page actor={actor} title="Usuários" active="admin-users" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Usuários</h1>
        <p class="lede">Três cargos, sem catálogo de permissões.</p>
      </div>
      <a class="btn btn-primary" href="/admin/users/new">Novo usuário</a>
    </div>
    {error ? <div class="alert alert-danger" role="alert">{error}</div> : null}
    {ok ? <div class="alert alert-success" role="status">{ok}</div> : null}
    {created
      ? (
        <div class="alert alert-success">
          <strong>Usuário criado.</strong> Senha temporária de{" "}
          <span class="mono">{created.email}</span>:
          <code>{created.password}</code>. Ela aparece uma vez; entregue por canal seguro.
        </div>
      )
      : null}
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Cargo</th>
            <th>Ativo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr>
              <td>
                <a class="title-link" href={`/admin/users/${user.id}`}>{user.display_name}</a>
              </td>
              <td>{user.email}</td>
              <td>{roleLabel(user.role)}</td>
              <td>{user.active ? "Sim" : "Não"}</td>
              <td>
                <a class="small" href={`/admin/users/${user.id}`}>editar</a>
                {user.id !== actor.id
                  ? (
                    <form
                      method="post"
                      action={`/admin/users/${user.id}/${user.active ? "block" : "unblock"}`}
                      class="inline ml-8"
                    >
                      <button class="link small" type="submit">
                        {user.active ? "bloquear" : "desbloquear"}
                      </button>
                    </form>
                  )
                  : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Page>
);

export const UserNewPage: FC<{ actor: Actor; unread: number; error?: string }> = ({
  actor,
  unread,
  error,
}) => (
  <Page actor={actor} title="Novo usuário" active="admin-users" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Novo usuário</h1>
        <p class="lede">A senha temporária é exibida uma vez.</p>
      </div>
    </div>
    {error ? <div class="alert alert-danger" role="alert">{error}</div> : null}
    <form method="post" action="/admin/users" class="form-card form-narrow">
      <Field label="Nome" name="name" required autofocus />
      <Field label="E-mail" name="email" type="email" required />
      <Select
        label="Cargo"
        name="role"
        value="developer"
        options={[
          { value: "developer", label: "Developer" },
          { value: "manager", label: "Manager" },
          { value: "admin", label: "Admin" },
        ]}
      />
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Criar usuário</button>
        <a class="btn" href="/admin/users">Cancelar</a>
      </div>
    </form>
  </Page>
);

export const UserEditPage: FC<{
  actor: Actor;
  unread: number;
  user: UserListRow;
  error?: string;
  temp?: string;
}> = ({ actor, unread, user, error, temp }) => (
  <Page actor={actor} title={user.display_name} active="admin-users" unread={unread}>
    <div class="page-head">
      <div>
        <h1>{user.display_name}</h1>
        <p class="lede">{user.email}</p>
      </div>
      <a class="btn" href="/admin/users">Voltar</a>
    </div>
    {error ? <div class="alert alert-danger" role="alert">{error}</div> : null}
    {temp
      ? (
        <div class="alert alert-success">
          Nova senha temporária: <code>{temp}</code>. Ela aparece uma vez.
        </div>
      )
      : null}
    <form method="post" action={`/admin/users/${user.id}`} class="form-card form-narrow">
      <Select
        label="Cargo"
        name="role"
        value={user.role}
        options={[
          { value: "developer", label: "Developer" },
          { value: "manager", label: "Manager" },
          { value: "admin", label: "Admin" },
        ]}
      />
      <label class="field">
        <span class="field-label">Ativo</span>
        <span>
          <input type="checkbox" name="active" checked={user.active === 1} /> pode entrar
        </span>
      </label>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Salvar</button>
      </div>
    </form>
    <form
      method="post"
      action={`/admin/users/${user.id}/password`}
      class="form-card section form-narrow"
    >
      <h2>Redefinir senha</h2>
      <p class="muted small">Gera uma senha temporária e revoga as sessões existentes.</p>
      <button class="btn" type="submit">Gerar nova senha</button>
    </form>
  </Page>
);
