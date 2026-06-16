CREATE TABLE IF NOT EXISTS salary_push_subscriptions (
  installation_id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  salary_day INTEGER NOT NULL DEFAULT 15,
  lead_days INTEGER NOT NULL DEFAULT 0,
  reminder_hour INTEGER NOT NULL DEFAULT 9,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  enabled INTEGER NOT NULL DEFAULT 1,
  permission TEXT NOT NULL DEFAULT 'default',
  app_name TEXT NOT NULL DEFAULT '薪期台账',
  user_agent TEXT NOT NULL DEFAULT '',
  last_sent_key TEXT NOT NULL DEFAULT '',
  last_sent_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_salary_push_enabled
  ON salary_push_subscriptions (enabled, reminder_hour);
