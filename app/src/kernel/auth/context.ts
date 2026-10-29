export type Role = "admin" | "manager" | "developer";
export type Action = "create" | "edit" | "archive" | "restore" | "export";
export type Resource = "project" | "demand" | "message" | "attachment" | "canvas" | "user" | "tag";

export interface Actor {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: Role;
  sessionId: string;
  mustChangePassword: boolean;
}

export interface ResourceContext {
  kind?: "task" | "issue";
  ownerId?: string | null;
  poId?: string | null;
  assigneeId?: string | null;
}

export type AppVariables = {
  actor: Actor | null;
  requestId: string;
  tenantId: string;
};

export type AppEnv = { Variables: AppVariables };
