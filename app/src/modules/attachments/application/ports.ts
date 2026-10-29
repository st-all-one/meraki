export interface DemandRef {
  id: string;
  kind: "task" | "issue";
  created_by: string;
  title: string;
  code: string;
}

export interface DemandsLookup {
  getItem(id: string): DemandRef | null;
}
