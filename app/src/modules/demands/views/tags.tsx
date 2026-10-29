import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import { Page } from "@layout/views/page.tsx";
import type { TagDisplay } from "@layout/views/types.ts";

export const TagsPage: FC<{
  actor: Actor;
  unread: number;
  tags: TagDisplay[];
  error?: string;
  ok?: string;
}> = ({ actor, unread, tags, error, ok }) => (
  <Page actor={actor} title="Tags" active="admin-tags" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Tags</h1>
        <p class="lede">
          Globais no espaço; qualquer usuário cria e anexa. Renomear/arquivar é de manager/admin.
        </p>
      </div>
    </div>
    {error ? <div class="alert alert-danger" role="alert">{error}</div> : null}
    {ok ? <div class="alert alert-success" role="status">{ok}</div> : null}
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Slug</th>
            <th>Estado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr>
              <td>{tag.name}</td>
              <td class="mono">{tag.slug}</td>
              <td>{tag.archived_at ? "arquivada" : "ativa"}</td>
              <td>
                {tag.archived_at
                  ? (
                    <form method="post" action={`/admin/tags/${tag.id}`} class="inline">
                      <input type="hidden" name="action" value="restore" />
                      <button class="link small" type="submit">restaurar</button>
                    </form>
                  )
                  : (
                    <form method="post" action={`/admin/tags/${tag.id}`} class="inline">
                      <input type="hidden" name="action" value="archive" />
                      <button class="link small danger" type="submit">arquivar</button>
                    </form>
                  )}
                <form method="post" action={`/admin/tags/${tag.id}`} class="inline ml-8">
                  <input type="hidden" name="action" value="rename" />
                  <input
                    class="input input-compact"
                    name="name"
                    value={tag.name}
                    aria-label={`Novo nome para ${tag.name}`}
                  />
                  <button class="link small" type="submit">renomear</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Page>
);
