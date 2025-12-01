-- 0002_datetime_columns.sql
-- Recreate-and-copy to new schema with INTEGER timestamps

BEGIN TRANSACTION;

-- Create new table
CREATE TABLE articles_new (
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

-- Copy and transform data from old table if exists
INSERT INTO articles_new (id, title, link, source, published_str, published_dt, first_seen_dt, last_seen_dt, hash)
SELECT 
    id,
    COALESCE(title, ''),
    COALESCE(link, ''),
    COALESCE(source, ''),
    published,
    NULL, -- cannot reliably parse here; leave NULL
    CAST(strftime('%s', first_seen) AS INTEGER),
    CAST(strftime('%s', last_seen) AS INTEGER),
    hash
FROM articles;

-- Replace old table
DROP TABLE articles;
ALTER TABLE articles_new RENAME TO articles;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_published_dt ON articles(published_dt);
CREATE INDEX IF NOT EXISTS idx_first_seen_dt ON articles(first_seen_dt);
CREATE INDEX IF NOT EXISTS idx_last_seen_dt ON articles(last_seen_dt);

-- View
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

-- Record schema version
INSERT INTO schema_version(version) VALUES ('0002');

COMMIT;