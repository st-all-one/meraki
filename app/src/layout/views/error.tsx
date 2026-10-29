import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import { Layout } from "@layout/views/layout.tsx";

export const ErrorPage: FC<{
  actor: Actor | null;
  status: number;
  title: string;
  detail: string;
  requestId?: string;
}> = ({ actor, status, title, detail, requestId }) => (
  <Layout title={title} actor={actor}>
    <div class="login-wrap">
      <div class="login-card">
        <p class="mono muted">{status}</p>
        <h1>{title}</h1>
        <p>{detail}</p>
        {requestId
          ? (
            <p class="small muted">
              Referência: <span class="mono">{requestId}</span>
            </p>
          )
          : null}
        <a class="btn btn-primary" href={actor ? "/demands" : "/login"}>
          {actor ? "Voltar às demandas" : "Entrar"}
        </a>
      </div>
    </div>
  </Layout>
);
