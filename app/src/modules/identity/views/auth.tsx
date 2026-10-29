import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import { Layout } from "@layout/views/layout.tsx";
import { Field } from "@layout/views/ui.tsx";

export const LoginPage: FC<{
  actor: Actor | null;
  email?: string;
  error?: string;
  next?: string;
  showSeed: boolean;
  seedEmail: string;
}> = ({ email = "", error, next, showSeed, seedEmail }) => (
  <Layout title="Entrar" actor={null}>
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-brand">
          <span class="brand-mark">M</span> Meraki
        </div>
        <h1>Entrar</h1>
        <p class="muted">Índice de demandas, tarefas e conversas do time.</p>
        {error ? <div class="alert alert-danger" role="alert">{error}</div> : null}
        <form method="post" action="/login" class="section">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <Field
            label="E-mail"
            name="email"
            type="email"
            value={email}
            autocomplete="username"
            required
            autofocus
          />
          <Field
            label="Senha"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />
          <button class="btn btn-primary btn-block" type="submit">Entrar</button>
        </form>
        {showSeed
          ? (
            <p class="small muted small muted mt-16">
              Desenvolvimento: <span class="mono">{seedEmail}</span> / senha do{" "}
              <span class="mono">.env</span>
            </p>
          )
          : null}
      </div>
    </div>
  </Layout>
);

export const PasswordPage: FC<{
  actor: Actor;
  error?: string;
  ok?: string;
  required?: boolean;
  unread?: number;
}> = ({ actor, error, ok, required, unread }) => (
  <Layout title="Senha" actor={actor} active="account" unread={unread}>
    <div class="account-grid">
      <div class="page-head">
        <div>
          <h1>Trocar senha</h1>
          <p class="lede">
            {required
              ? "Sua senha é temporária. Troque antes de continuar."
              : "Mínimo de 12 caracteres."}
          </p>
        </div>
      </div>
      {error ? <div class="alert alert-danger" role="alert">{error}</div> : null}
      {ok ? <div class="alert alert-success" role="status">{ok}</div> : null}
      <form method="post" action="/account/password" class="form-card">
        <Field
          label="Senha atual"
          name="current"
          type="password"
          autocomplete="current-password"
          required
        />
        <Field
          label="Nova senha"
          name="password"
          type="password"
          autocomplete="new-password"
          required
          hint="12 caracteres ou mais."
        />
        <Field
          label="Confirmar nova senha"
          name="confirm"
          type="password"
          autocomplete="new-password"
          required
        />
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">Salvar senha</button>
          {!required ? <a class="btn" href="/demands">Cancelar</a> : null}
        </div>
      </form>
    </div>
  </Layout>
);
