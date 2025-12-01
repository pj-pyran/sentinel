-- 0001_initial.sql
-- Create initial articles table (legacy schema)
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT,
    link TEXT,
    source TEXT,
    published TEXT,
    first_seen TEXT,
    last_seen TEXT,
    hash TEXT
);

-- Record schema version
INSERT INTO schema_version(version) VALUES ('0001') ON CONFLICT DO NOTHING;