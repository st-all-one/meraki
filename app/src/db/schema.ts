/**
 * Composition root do schema (ADR-017). Cada dono declara suas tabelas em
 * `infrastructure/schema.ts`; este arquivo só agrega. O runtime Meraki usa
 * `node:sqlite` direto, mas os tipos continuam separados por dono.
 */
export interface BaseSchema {
  created_at: string;
  updated_at?: string;
}

export interface TenantsTable extends BaseSchema {
  id: string;
  slug: string;
  name: string;
}

export interface UsersTable extends BaseSchema {
  id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  password_hash: string;
  role: "admin" | "manager" | "developer";
  must_change_password: number;
  active: number;
}

export interface SessionsTable extends BaseSchema {
  id: string;
  tenant_id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface AuditLogsTable extends BaseSchema {
  id: string;
  tenant_id: string;
  actor_id: string | null;
  action: string;
  metadata: string;
}

export interface AppSchema {
  tenants: TenantsTable;
  users: UsersTable;
  sessions: SessionsTable;
  audit_logs: AuditLogsTable;
}
