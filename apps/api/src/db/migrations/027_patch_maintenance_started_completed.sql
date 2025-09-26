
-- 027_patch_maintenance_started_completed.sql
-- Purpose: reports.controller expects columns `started_at` and `completed_at` on maintenance table.
-- Some schemas name them differently. This patch adds the expected columns if missing
-- and attempts to backfill from best-effort source columns.
-- Idempotent and safe to re-run.

BEGIN;

DO $$
DECLARE
  tbl text := NULL;
  have_started_at boolean := false;
  have_completed_at boolean := false;
  -- candidate source columns for backfill (ordered by preference)
  src_started text := NULL;
  src_completed text := NULL;
BEGIN
  -- detect table name
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='maintenances') THEN
    tbl := 'maintenances';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='maintenance') THEN
    tbl := 'maintenance';
  ELSE
    RETURN; -- nothing to do
  END IF;

  -- check presence of target columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name=tbl AND column_name='started_at'
  ) INTO have_started_at;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name=tbl AND column_name='completed_at'
  ) INTO have_completed_at;

  -- add missing columns
  IF NOT have_started_at THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN started_at TIMESTAMPTZ', tbl);
  END IF;

  IF NOT have_completed_at THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN completed_at TIMESTAMPTZ', tbl);
  END IF;

  -- determine source columns for backfill if any
  FOR src_started IN
    SELECT c.column_name
    FROM information_schema.columns c
    WHERE c.table_name=tbl AND c.column_name IN ('start_at','start_time','started','startedat','started_time')
    ORDER BY
      CASE c.column_name
        WHEN 'started_at' THEN 1
        WHEN 'start_at' THEN 2
        WHEN 'start_time' THEN 3
        WHEN 'started' THEN 4
        WHEN 'startedat' THEN 5
        WHEN 'started_time' THEN 6
        ELSE 100
      END
    LIMIT 1
  LOOP
    EXIT;
  END LOOP;

  FOR src_completed IN
    SELECT c.column_name
    FROM information_schema.columns c
    WHERE c.table_name=tbl AND c.column_name IN ('end_at','end_time','completed','completedat','completed_time')
    ORDER BY
      CASE c.column_name
        WHEN 'completed_at' THEN 1
        WHEN 'end_at' THEN 2
        WHEN 'end_time' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'completedat' THEN 5
        WHEN 'completed_time' THEN 6
        ELSE 100
      END
    LIMIT 1
  LOOP
    EXIT;
  END LOOP;

  -- backfill if target is NULL and a source exists
  IF src_started IS NOT NULL THEN
    EXECUTE format('UPDATE %I SET started_at = %I WHERE started_at IS NULL', tbl, src_started);
  END IF;

  IF src_completed IS NOT NULL THEN
    EXECUTE format('UPDATE %I SET completed_at = %I WHERE completed_at IS NULL', tbl, src_completed);
  END IF;

  -- optional helpful indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename=tbl AND indexname=tbl||'_started_at_idx'
  ) THEN
    EXECUTE format('CREATE INDEX %I ON %I(started_at)', tbl||'_started_at_idx', tbl);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename=tbl AND indexname=tbl||'_completed_at_idx'
  ) THEN
    EXECUTE format('CREATE INDEX %I ON %I(completed_at)', tbl||'_completed_at_idx', tbl);
  END IF;

END $$;

COMMIT;
