
-- 018_patch_deliveries_returns_created_at.sql
-- Fix: controllers expect `RETURNING id, created_at` on deliveries/returns.
-- Adds created_at columns while preserving delivered_at/returned_at.

BEGIN;

ALTER TABLE deliveries
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE returns
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMIT;

-- Verification (optional):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name IN ('deliveries','returns') AND column_name='created_at';
