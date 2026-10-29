export type ItemKind = "task" | "issue";
export type Quadrant = "q1" | "q2" | "q3" | "q4";

export interface AttachmentDisplay {
  id: string;
  original_name: string;
  mime: string;
  bytes: number;
  uploader_name?: string;
}

export interface MessageDisplay {
  id: string;
  channel_id: string;
  author_id: string;
  author_name: string;
  body_md: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachments: AttachmentDisplay[];
}

export interface TagDisplay {
  id: string;
  name: string;
  slug: string;
  archived_at: string | null;
}

export interface PriorityDisplay {
  value: Quadrant | null;
  source: "auto" | "manual" | "none";
}
