CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('assigned','po','message','issue','promoted','system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  read_at TEXT,
  pushed_at TEXT
) STRICT;
CREATE INDEX notifications_user ON notifications(user_id, read_at, created_at);

CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  endpoint_hash TEXT NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  disabled_at TEXT
) STRICT;

CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  push_enabled INTEGER NOT NULL DEFAULT 0 CHECK (push_enabled IN (0,1)),
  assignments INTEGER NOT NULL DEFAULT 1 CHECK (assignments IN (0,1)),
  po_changes INTEGER NOT NULL DEFAULT 1 CHECK (po_changes IN (0,1)),
  demand_messages INTEGER NOT NULL DEFAULT 1 CHECK (demand_messages IN (0,1)),
  new_issues INTEGER NOT NULL DEFAULT 0 CHECK (new_issues IN (0,1)),
  hide_details INTEGER NOT NULL DEFAULT 0 CHECK (hide_details IN (0,1)),
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE push_deliveries (
  notification_id TEXT NOT NULL REFERENCES notifications(id),
  subscription_id TEXT NOT NULL REFERENCES push_subscriptions(id),
  status TEXT NOT NULL CHECK (status IN ('pending','sent','failed','gone')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (notification_id, subscription_id)
) STRICT;
