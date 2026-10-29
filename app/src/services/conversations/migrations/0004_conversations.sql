CREATE TABLE chat_channels (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  scope TEXT NOT NULL CHECK (scope IN ('general','project','demand')),
  project_id TEXT REFERENCES projects(id),
  demand_id TEXT REFERENCES items(id),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  archived_at TEXT,
  CHECK (
    (scope = 'general' AND project_id IS NULL AND demand_id IS NULL) OR
    (scope = 'project' AND project_id IS NOT NULL AND demand_id IS NULL) OR
    (scope = 'demand' AND project_id IS NULL AND demand_id IS NOT NULL)
  )
) STRICT;
CREATE UNIQUE INDEX chat_general_unique ON chat_channels(tenant_id) WHERE scope = 'general';
CREATE UNIQUE INDEX chat_project_unique ON chat_channels(project_id) WHERE scope = 'project';
CREATE UNIQUE INDEX chat_demand_unique ON chat_channels(demand_id) WHERE scope = 'demand';

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  channel_id TEXT NOT NULL REFERENCES chat_channels(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  body_md TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  edited_at TEXT,
  deleted_at TEXT,
  CHECK (length(body_md) <= 10000)
) STRICT;
CREATE INDEX chat_messages_channel ON chat_messages(channel_id, created_at);

CREATE TABLE chat_message_edits (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES chat_messages(id),
  old_body_md TEXT NOT NULL,
  edited_by TEXT NOT NULL REFERENCES users(id),
  edited_at TEXT NOT NULL
) STRICT;

CREATE TABLE chat_reads (
  channel_id TEXT NOT NULL REFERENCES chat_channels(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  last_read_message_id TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (channel_id, user_id)
) STRICT;

CREATE TABLE chat_message_attachments (
  message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  attachment_id TEXT NOT NULL REFERENCES attachments(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (message_id, attachment_id)
) STRICT;
