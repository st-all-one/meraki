CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  uploader_id TEXT NOT NULL REFERENCES users(id),
  sha256 TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes > 0),
  width INTEGER,
  height INTEGER,
  storage_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (tenant_id, sha256)
) STRICT;

CREATE TABLE demand_attachments (
  item_id TEXT NOT NULL REFERENCES items(id),
  attachment_id TEXT NOT NULL REFERENCES attachments(id),
  kind TEXT NOT NULL DEFAULT 'file' CHECK (kind IN ('file','canvas_export')),
  archived_at TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (item_id, attachment_id)
) STRICT;
