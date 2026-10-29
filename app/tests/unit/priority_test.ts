import { assertEquals } from "@std/assert";
import { calculatePriority, effectivePriority } from "../../src/modules/demands/domain/priority.ts";

Deno.test("Eisenhower: atrasada e importante é Q1", () => {
  assertEquals(
    calculatePriority({ end_date: "2026-10-01", importance: "high" }, "2026-10-29"),
    "q1",
  );
});

Deno.test("Eisenhower: hoje+2 é urgente; hoje+3 não", () => {
  assertEquals(
    calculatePriority({ end_date: "2026-10-31", importance: "medium" }, "2026-10-29"),
    "q1",
  );
  assertEquals(
    calculatePriority({ end_date: "2026-11-01", importance: "medium" }, "2026-10-29"),
    "q2",
  );
});

Deno.test("Eisenhower: baixa importância urgente é Q3 e futura é Q4", () => {
  assertEquals(
    calculatePriority({ end_date: "2026-10-30", importance: "low" }, "2026-10-29"),
    "q3",
  );
  assertEquals(
    calculatePriority({ end_date: "2026-12-01", importance: "low" }, "2026-10-29"),
    "q4",
  );
});

Deno.test("prioridade efetiva: issue/done não têm prioridade", () => {
  assertEquals(
    effectivePriority({
      kind: "issue",
      status: "open",
      end_date: "2026-10-01",
      importance: "high",
      priority_override: null,
    }, "2026-10-29").value,
    null,
  );
  assertEquals(
    effectivePriority({
      kind: "task",
      status: "done",
      end_date: "2026-10-01",
      importance: "high",
      priority_override: "q1",
    }, "2026-10-29").source,
    "none",
  );
});

Deno.test("override vence o cálculo e mantém o calculado", () => {
  const result = effectivePriority({
    kind: "task",
    status: "todo",
    end_date: "2026-12-01",
    importance: "low",
    priority_override: "q2",
  }, "2026-10-29");
  assertEquals(result.value, "q2");
  assertEquals(result.source, "manual");
  assertEquals(result.calculated, "q4");
});
