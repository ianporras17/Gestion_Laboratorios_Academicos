
-- 021_patch_inventory_movements_reference.sql
-- Add column expected by approved.controller.js: `reference` on inventory_movements.
-- Used to store a human/foreign reference (e.g., delivery_id, return_id, code).

BEGIN;

ALTER TABLE inventory_movements
    ADD COLUMN IF NOT EXISTS reference TEXT;

-- Optional but helpful: quick index to search by reference when joining/retrieving history
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_inventory_movements_reference'
          AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_inventory_movements_reference
            ON inventory_movements (reference);
    END IF;
END $$;

COMMIT;
