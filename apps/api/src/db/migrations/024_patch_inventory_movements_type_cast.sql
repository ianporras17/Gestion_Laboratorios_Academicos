
-- 024_patch_inventory_movements_type_cast.sql
-- Fix COALESCE type mismatch between movement_type (enum) and type (text).
-- Make `type` a TEXT column, backfill from movement_type::text, set default, and drop NOT NULL.
-- Idempotent and safe to re-run.

BEGIN;

DO $$
DECLARE
  v_udt_name text;
BEGIN
  -- Ensure column `type` exists before altering
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory_movements' AND column_name='type'
  ) THEN

    -- If `type` is not TEXT, convert it to TEXT first
    SELECT c.udt_name INTO v_udt_name
    FROM information_schema.columns c
    WHERE c.table_name='inventory_movements' AND c.column_name='type';

    IF v_udt_name IS DISTINCT FROM 'text' THEN
      ALTER TABLE inventory_movements
        ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;

    -- Backfill using explicit casts to avoid enum/text mismatch
    UPDATE inventory_movements
       SET type = COALESCE(type, (movement_type::text), 'OUT')
     WHERE type IS NULL;

    -- Ensure DEFAULT and NULLability are friendly to current controller
    ALTER TABLE inventory_movements
      ALTER COLUMN type SET DEFAULT 'OUT';

    ALTER TABLE inventory_movements
      ALTER COLUMN type DROP NOT NULL;
  END IF;
END $$;

COMMIT;
