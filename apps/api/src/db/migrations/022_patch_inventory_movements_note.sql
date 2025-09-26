
-- 022_patch_inventory_movements_note.sql
-- Add column expected by approved.controller.js: `note` on inventory_movements.

BEGIN;

ALTER TABLE inventory_movements
    ADD COLUMN IF NOT EXISTS note TEXT;

COMMIT;
