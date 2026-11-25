-- Beta waitlist. Apply with:
--   npx wrangler d1 execute sightrader-waitlist --remote --file=schema.sql   (live database)
--   npx wrangler d1 execute sightrader-waitlist --local  --file=schema.sql   (local dev)

CREATE TABLE IF NOT EXISTS signups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT,      -- retail | quant | institution | research | curious
  agent_use   TEXT,      -- not_yet | experimenting | live
  markets     TEXT,      -- comma-separated: stocks,futures,fx,crypto,options
  source      TEXT,      -- from ?ref= or ?utm_source= on the landing URL
  referrer    TEXT,      -- hostname of the referring site
  country     TEXT,      -- two-letter country code from Cloudflare
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signups_created ON signups (created_at);
