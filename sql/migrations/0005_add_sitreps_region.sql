-- 0005_add_sitreps_region.sql
-- Add region column to sitreps for hierarchical location filtering.
-- region is populated from country[0].region.name via the ReliefWeb API.

BEGIN TRANSACTION;

ALTER TABLE sitreps ADD COLUMN region TEXT;

CREATE INDEX IF NOT EXISTS idx_sitreps_region ON sitreps(region);

INSERT OR IGNORE INTO schema_version(version) VALUES ('0005');

COMMIT;
