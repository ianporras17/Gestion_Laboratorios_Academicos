
-- 026_patch_resources_unit.sql
-- Some deployments of `resources` don't include `unit` (used for MATERIAL).
-- This patch adds it safely and idempotently.

BEGIN;

ALTER TABLE resources
    ADD COLUMN IF NOT EXISTS unit TEXT;

COMMIT;
