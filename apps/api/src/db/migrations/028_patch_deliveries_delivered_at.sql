
-- 028_patch_deliveries_delivered_at.sql
-- Reports 'usage' relies on deliveries.delivered_at (NOT created_at).
-- Add the column if missing and backfill from created_at when NULL.

BEGIN;

-- Add column if missing
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Backfill from created_at when available
UPDATE deliveries
SET delivered_at = COALESCE(delivered_at, created_at, now())
WHERE delivered_at IS NULL;

-- Helpful index for date range filtering in reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='deliveries' AND indexname='deliveries_delivered_at_idx'
  ) THEN
    CREATE INDEX deliveries_delivered_at_idx ON deliveries(delivered_at);
  END IF;
END $$;

COMMIT;
