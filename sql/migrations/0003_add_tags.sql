-- 003_add_tags.sql
-- Add JSON tags column for ML classification results

BEGIN TRANSACTION;

-- Add tags column (stores JSON array of strings)
ALTER TABLE articles ADD COLUMN tags TEXT DEFAULT '[]';

-- Index for tag column (simple index on the JSON text)
CREATE INDEX IF NOT EXISTS idx_tags ON articles(tags);

-- Update view to include tags
DROP VIEW IF EXISTS articles_readable;
CREATE VIEW articles_readable AS
SELECT 
    id,
    title,
    link,
    source,
    published_str,
    datetime(published_dt, 'unixepoch') as published_datetime,
    datetime(first_seen_dt, 'unixepoch') as first_seen_datetime,
    datetime(last_seen_dt, 'unixepoch') as last_seen_datetime,
    tags,
    hash
FROM articles;

-- Record schema version
INSERT INTO schema_version(version) VALUES ('0003');

COMMIT;
