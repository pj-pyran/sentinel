-- 0009_add_prompt_history.sql
-- Audit table for system prompt versions used by generate_summaries.py.
-- Each unique combination of system_prompt + model gets one row.
-- AI summary records in sitreps.json carry a prompt_id field that
-- references this table for traceability across prompt engineering iterations.

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS prompt_history (
    id              TEXT    PRIMARY KEY,  -- SHA-256[:12] of (system_prompt || model)
    system_prompt   TEXT    NOT NULL,
    model           TEXT    NOT NULL,
    first_used_dt   INTEGER NOT NULL      -- unix timestamp of first use
);

INSERT OR IGNORE INTO schema_version(version) VALUES ('0009');

COMMIT;
