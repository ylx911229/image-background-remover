CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  paypal_subscription_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  credits_per_month INTEGER NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
