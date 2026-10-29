export interface DemandRef {
  id: string;
  kind: "task" | "issue";
  created_by: string;
  title: string;
  code: string;
}

export interface DemandsLookup {
  getItem(id: string): DemandRef | null;
  recordEvent(itemId: string, kind: string, from?: string | null, to?: string | null): void;
}
