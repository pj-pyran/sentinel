-- 0004_add_sitreps.sql
-- Sitrep history archive table.
-- history.db becomes the canonical store; sitreps.json is an export view.

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS sitreps (
    id              TEXT    PRIMARY KEY,           -- e.g. "rw-4203720"
    provider        TEXT    NOT NULL DEFAULT 'reliefweb',
    type            TEXT    NOT NULL DEFAULT 'original',
    title           TEXT    NOT NULL,
    source          TEXT    NOT NULL,              -- publisher shortname e.g. "OCHA"
    crisis          TEXT,
    location        TEXT,
    date            TEXT    NOT NULL,              -- YYYY-MM-DD
    content         TEXT,
    url             TEXT,
    first_seen_dt   INTEGER NOT NULL,              -- unix timestamp
    last_seen_dt    INTEGER NOT NULL               -- unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_sitreps_date     ON sitreps(date);
CREATE INDEX IF NOT EXISTS idx_sitreps_source   ON sitreps(source);
CREATE INDEX IF NOT EXISTS idx_sitreps_location ON sitreps(location);
CREATE INDEX IF NOT EXISTS idx_sitreps_provider ON sitreps(provider);

INSERT OR IGNORE INTO schema_version(version) VALUES ('0004');

COMMIT;
