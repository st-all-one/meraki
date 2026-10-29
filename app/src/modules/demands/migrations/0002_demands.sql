CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  next_seq INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, key)
) STRICT;

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  seq INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('task','issue')),
  title TEXT NOT NULL,
  description_md TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('backlog','todo','doing','review','done','open','accepted','rejected')),
  blocked INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0,1)),
  blocked_reason TEXT,
  importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('low','medium','high')),
  priority_override TEXT CHECK (priority_override IS NULL OR priority_override IN ('q1','q2','q3','q4')),
  priority_override_by TEXT REFERENCES users(id),
  priority_override_at TEXT,
  priority_override_reason TEXT,
  start_date TEXT,
  end_date TEXT,
  assignee_id TEXT REFERENCES users(id),
  po_id TEXT REFERENCES users(id),
  completed_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  promoted_at TEXT,
  promoted_by TEXT REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  UNIQUE (project_id, seq),
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
  CHECK (kind <> 'task' OR (start_date IS NOT NULL AND end_date IS NOT NULL AND assignee_id IS NOT NULL)),
  CHECK (kind <> 'issue' OR po_id IS NULL)
) STRICT;

CREATE INDEX items_general ON items(tenant_id, kind, status, updated_at) WHERE archived_at IS NULL;
CREATE INDEX items_project ON items(project_id, kind, status, end_date) WHERE archived_at IS NULL;
CREATE INDEX items_assignee ON items(assignee_id, status, end_date) WHERE archived_at IS NULL;
CREATE INDEX items_po ON items(po_id, status, end_date) WHERE archived_at IS NULL;
CREATE INDEX items_updated ON items(tenant_id, updated_at) WHERE archived_at IS NULL;

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  UNIQUE (tenant_id, slug),
  UNIQUE (tenant_id, name)
) STRICT;

CREATE TABLE item_tags (
  item_id TEXT NOT NULL REFERENCES items(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (item_id, tag_id)
) STRICT;
CREATE INDEX item_tags_tag ON item_tags(tag_id, item_id);

CREATE TABLE demand_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  actor_id TEXT REFERENCES users(id),
  kind TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX demand_events_item ON demand_events(item_id, created_at);
