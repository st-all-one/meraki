import type { Action, Actor, Resource, ResourceContext } from "@kernel/auth/context.ts";
export type { Action, Actor, Resource, ResourceContext, Role } from "@kernel/auth/context.ts";

export function can(
  actor: Pick<Actor, "id" | "role">,
  action: Action,
  resource: Resource,
  ctx: ResourceContext = {},
): boolean {
  if (actor.role === "admin") return true;
  if (action === "export") return resource !== "user";
  if (resource === "user" || resource === "project") return false;
  if (resource === "tag") {
    if (action === "create") return true;
    if (action === "edit" || action === "archive") return actor.role === "manager";
    return true;
  }
  if (resource === "canvas") return true;
  if (resource === "message" || resource === "attachment") {
    if (action === "create") return true;
    return ctx.ownerId === actor.id;
  }
  if (resource === "demand") {
    if (action === "create") {
      return ctx.kind === "issue" || actor.role === "manager";
    }
    if (action === "edit") return true;
    if (action === "archive" || action === "restore") {
      if (ctx.kind === "task") return actor.role === "manager";
      return ctx.ownerId === actor.id;
    }
  }
  return false;
}

export function canManageTags(actor: Pick<Actor, "role">): boolean {
  return actor.role === "admin" || actor.role === "manager";
}

export function canOverridePriority(actor: Pick<Actor, "role">): boolean {
  return actor.role === "admin" || actor.role === "manager";
}

export function canSetPo(actor: Pick<Actor, "role">): boolean {
  return actor.role === "admin" || actor.role === "manager";
}

export function canCreateTask(actor: Pick<Actor, "role">): boolean {
  return actor.role === "admin" || actor.role === "manager";
}

export function canPromote(actor: Pick<Actor, "role">): boolean {
  return actor.role === "admin" || actor.role === "manager";
}
