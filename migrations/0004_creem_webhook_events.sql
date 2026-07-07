CREATE TABLE IF NOT EXISTS creem_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  resource_id TEXT,
  status TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  raw_event TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creem_webhook_events_event_type ON creem_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_creem_webhook_events_resource_id ON creem_webhook_events(resource_id);
