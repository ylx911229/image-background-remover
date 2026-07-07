CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_order_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  captured_at TEXT,
  raw_response TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_payment_id TEXT,
  plan_id TEXT NOT NULL,
  total_credits INTEGER NOT NULL,
  remaining_credits INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_payment_id) REFERENCES payment_orders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS credit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  delta INTEGER NOT NULL,
  grant_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grant_id) REFERENCES credit_grants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider_order_id ON payment_orders(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_credit_grants_user_id ON credit_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_grants_expires_at ON credit_grants(expires_at);
CREATE INDEX IF NOT EXISTS idx_credit_events_user_id_created_at ON credit_events(user_id, created_at);
