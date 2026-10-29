export function formValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function boolValue(value: unknown): boolean {
  return value === "on" || value === "1" || value === "true";
}

export function pageParam(url: string): { page: number; limit: number; offset: number } {
  const params = new URL(url).searchParams;
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const limit = 50;
  return { page, limit, offset: (page - 1) * limit };
}
