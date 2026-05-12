-- 0008_add_scope.sql
-- Adds scope classification to sitreps: 'single', 'regional', or 'global'
BEGIN TRANSACTION;
ALTER TABLE sitreps ADD COLUMN scope TEXT DEFAULT 'single';
INSERT OR IGNORE INTO schema_version(version) VALUES ('0008');
COMMIT;
