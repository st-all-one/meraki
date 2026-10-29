import type { Child, FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import { Layout } from "./layout.tsx";

export const Page: FC<{
  actor: Actor;
  title: string;
  active?: string;
  unread?: number;
  children: Child;
}> = ({ actor, title, active, unread, children }) => (
  <Layout actor={actor} title={title} active={active} unread={unread}>{children}</Layout>
);

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year ?? ""}`;
}

export function roleLabel(role: string): string {
  return role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Developer";
}
