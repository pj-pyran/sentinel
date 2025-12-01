-- Articles archive table
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    source TEXT NOT NULL,
    published_str TEXT,
    published_dt INTEGER,
    first_seen_dt INTEGER NOT NULL,
    last_seen_dt INTEGER NOT NULL,
    hash TEXT NOT NULL UNIQUE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_published_dt ON articles(published_dt);
CREATE INDEX IF NOT EXISTS idx_first_seen_dt ON articles(first_seen_dt);
CREATE INDEX IF NOT EXISTS idx_last_seen_dt ON articles(last_seen_dt);

-- View with human-readable datetime strings
CREATE VIEW IF NOT EXISTS articles_readable AS
SELECT 
    id,
    title,
    link,
    source,
    published_str,
    datetime(published_dt, 'unixepoch') as published_datetime,
    datetime(first_seen_dt, 'unixepoch') as first_seen_datetime,
    datetime(last_seen_dt, 'unixepoch') as last_seen_datetime,
    hash
FROM articles;
