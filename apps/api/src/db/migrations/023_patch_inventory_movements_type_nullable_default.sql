
-- 023_patch_inventory_movements_type_nullable_default.sql (FIXED)
-- Safe and idempotent: avoid enum/text COALESCE mismatch by casting movement_type::text.
-- Also ensure `type` column is TEXT before backfill, then set DEFAULT and drop NOT NULL.

BEGIN;

DO $$
DECLARE
  v_exists boolean;
  v_udt text;
BEGIN
  -- Apply only if the column `type` exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory_movements' AND column_name='type'
  ) INTO v_exists;

  IF v_exists THEN
    -- Ensure `type` is TEXT to prevent casts failing later
    SELECT c.udt_name INTO v_udt
    FROM information_schema.columns c
    WHERE c.table_name='inventory_movements' AND c.column_name='type';

    IF v_udt IS DISTINCT FROM 'text' THEN
      ALTER TABLE inventory_movements
        ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;

    -- Backfill using explicit enum->text cast
    UPDATE inventory_movements
       SET type = COALESCE(type, (movement_type::text), 'OUT')
     WHERE type IS NULL;

    -- Default + allow NULLs to be safer with current controller
    ALTER TABLE inventory_movements
      ALTER COLUMN type SET DEFAULT 'OUT';

    ALTER TABLE inventory_movements
      ALTER COLUMN type DROP NOT NULL;
  END IF;
END $$;

COMMIT;
