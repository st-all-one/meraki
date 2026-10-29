import { addDays, todayIso } from "@kernel/util.ts";

export type Quadrant = "q1" | "q2" | "q3" | "q4";
export type Importance = "low" | "medium" | "high";

export interface PriorityInput {
  kind: "task" | "issue";
  status: string;
  end_date: string | null;
  importance: Importance;
  priority_override: Quadrant | null;
}

export interface EffectivePriority {
  value: Quadrant | null;
  source: "auto" | "manual" | "none";
  calculated: Quadrant | null;
}

export const PRIORITY_LABEL: Record<Quadrant, string> = {
  q1: "Fazer agora",
  q2: "Agendar",
  q3: "Delegar",
  q4: "Depois",
};

export function calculatePriority(
  input: Pick<PriorityInput, "end_date" | "importance">,
  today = todayIso(),
): Quadrant {
  // Urgente inclui atrasadas: qualquer fim <= hoje+2.
  const urgent = input.end_date !== null && input.end_date <= addDays(today, 2);
  const important = input.importance === "medium" || input.importance === "high";
  if (urgent && important) return "q1";
  if (!urgent && important) return "q2";
  if (urgent && !important) return "q3";
  return "q4";
}

export function effectivePriority(
  input: PriorityInput,
  today = todayIso(),
): EffectivePriority {
  if (input.kind === "issue" || input.status === "done") {
    return { value: null, source: "none", calculated: null };
  }
  const calculated = calculatePriority(input, today);
  if (input.priority_override) {
    return { value: input.priority_override, source: "manual", calculated };
  }
  return { value: calculated, source: "auto", calculated };
}

export function priorityRank(value: Quadrant | null): number {
  return value === null ? 5 : Number(value.slice(1));
}
