import { assertEquals } from "@std/assert";
import { can, type Role } from "../../src/services/auth/policy.ts";

const actor = (role: Role) => ({ id: "u1", role });

Deno.test("manager cria/arquiva tarefa, mas não gerencia usuários/pastas", () => {
  assertEquals(can(actor("manager"), "create", "demand", { kind: "task" }), true);
  assertEquals(can(actor("manager"), "archive", "demand", { kind: "task" }), true);
  assertEquals(can(actor("manager"), "create", "user"), false);
  assertEquals(can(actor("manager"), "archive", "project"), false);
  assertEquals(can(actor("manager"), "edit", "tag"), true);
});

Deno.test("developer cria issue, não tarefa, e arquiva apenas a própria issue", () => {
  assertEquals(can(actor("developer"), "create", "demand", { kind: "issue" }), true);
  assertEquals(can(actor("developer"), "create", "demand", { kind: "task" }), false);
  assertEquals(can(actor("developer"), "archive", "demand", { kind: "task" }), false);
  assertEquals(
    can(actor("developer"), "archive", "demand", { kind: "issue", ownerId: "u1" }),
    true,
  );
  assertEquals(
    can(actor("developer"), "archive", "demand", { kind: "issue", ownerId: "u2" }),
    false,
  );
  assertEquals(can(actor("developer"), "edit", "tag"), false);
});

Deno.test("admin gerencia tudo", () => {
  assertEquals(can(actor("admin"), "create", "user"), true);
  assertEquals(can(actor("admin"), "archive", "project"), true);
  assertEquals(can(actor("admin"), "archive", "demand", { kind: "issue", ownerId: "u2" }), true);
});
