-- 0007_sitreps_file_fields.sql
-- Adds file-attachment columns to sitreps:
--   rw_id        — raw ReliefWeb numeric report ID (data[x].id)
--   file_url     — primary file download URL (data[x].fields.file[0].url)
--   file_preview — large preview image URL, falling back to regular preview
--   file_size    — file size in bytes (data[x].fields.file[0].filesize)

BEGIN TRANSACTION;

ALTER TABLE sitreps ADD COLUMN rw_id       TEXT;
ALTER TABLE sitreps ADD COLUMN file_url    TEXT;
ALTER TABLE sitreps ADD COLUMN file_preview TEXT;
ALTER TABLE sitreps ADD COLUMN file_size   INTEGER;

CREATE INDEX IF NOT EXISTS idx_sitreps_rw_id ON sitreps(rw_id);

INSERT OR IGNORE INTO schema_version(version) VALUES ('0007');

COMMIT;
