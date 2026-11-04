-- Wish Garden V0.5: minimum-necessary pseudonymous opt-ins; no prayers, names, emails, IPs.
CREATE TABLE IF NOT EXISTS participation (
  receipt_hash TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  topic INTEGER NOT NULL CHECK(topic BETWEEN 0 AND 5),
  created_at TEXT NOT NULL,
  withdrawn_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_participation_batch_active ON participation(batch_id, withdrawn_at, topic);
