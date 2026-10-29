CREATE TABLE whiteboards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  demand_id TEXT NOT NULL UNIQUE REFERENCES items(id),
  scene_json TEXT NOT NULL DEFAULT '{"elements":[],"appState":{}}',
  scene_version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
) STRICT;

CREATE TABLE whiteboard_snapshots (
  id TEXT PRIMARY KEY,
  whiteboard_id TEXT NOT NULL REFERENCES whiteboards(id),
  scene_json TEXT NOT NULL,
  scene_version INTEGER NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('autosave','manual','export','join'))
) STRICT;
CREATE INDEX whiteboard_snapshots_board ON whiteboard_snapshots(whiteboard_id, created_at);

CREATE TABLE whiteboard_sessions (
  id TEXT PRIMARY KEY,
  whiteboard_id TEXT NOT NULL REFERENCES whiteboards(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at TEXT NOT NULL,
  left_at TEXT
) STRICT;

CREATE TABLE whiteboard_files (
  whiteboard_id TEXT NOT NULL REFERENCES whiteboards(id),
  excalidraw_file_id TEXT NOT NULL,
  attachment_id TEXT NOT NULL REFERENCES attachments(id),
  PRIMARY KEY (whiteboard_id, excalidraw_file_id)
) STRICT;

CREATE TABLE whiteboard_exports (
  id TEXT PRIMARY KEY,
  whiteboard_id TEXT NOT NULL REFERENCES whiteboards(id),
  attachment_id TEXT NOT NULL REFERENCES attachments(id),
  format TEXT NOT NULL CHECK (format IN ('excalidraw','png','svg')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
) STRICT;
