DO $$
BEGIN
  -- Solo renombrar si NO existe 'type' y SÍ existe 'movement_type'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory_movements' AND column_name='movement_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory_movements' AND column_name='type'
  ) THEN
    ALTER TABLE inventory_movements RENAME COLUMN movement_type TO type;
  END IF;
END $$;

