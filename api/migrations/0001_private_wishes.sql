-- Wish Garden private wish ledger v0.2 (Cloudflare D1 / SQLite).
-- No public wish text, no money transfers, no automatic sharing.
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  owner_sub TEXT NOT NULL,
  topic TEXT NOT NULL CHECK (topic IN ('peace','family','health','future','remember','gratitude')),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 700),
  state TEXT NOT NULL DEFAULT 'ongoing' CHECK (state IN ('ongoing','fulfilled','released')),
  aggregate_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (aggregate_opt_in IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wishes_owner_created ON wishes(owner_sub,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_aggregate ON wishes(aggregate_opt_in,topic,created_at);
CREATE TABLE IF NOT EXISTS write_quotas (
  owner_sub TEXT NOT NULL,
  hour_bucket TEXT NOT NULL,
  counter INTEGER NOT NULL CHECK(counter >= 0),
  PRIMARY KEY (owner_sub,hour_bucket)
);
