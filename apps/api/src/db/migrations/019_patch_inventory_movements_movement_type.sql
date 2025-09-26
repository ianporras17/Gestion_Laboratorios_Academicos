
-- 019_patch_inventory_movements_movement_type.sql
-- Adds the column expected by approved.controller.js when creating deliveries/returns.
-- Minimal, non-breaking patch.

BEGIN;

ALTER TABLE inventory_movements
    ADD COLUMN IF NOT EXISTS movement_type TEXT NOT NULL DEFAULT 'OUT';

-- Also ensure we have a timestamp for debugging/consistency (safe if already present)
ALTER TABLE inventory_movements
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMIT;

-- After applying this, rerun the delivery flow:
-- 1) POST /api/approved/{{request_id}}/validate
-- 2) POST /api/approved/{{request_id}}/deliver  (should now work)
