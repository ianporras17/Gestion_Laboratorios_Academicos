DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory_movements' AND column_name='movement_type'
  ) THEN
    ALTER TABLE inventory_movements RENAME COLUMN movement_type TO type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventory_movements' AND column_name='user_id'
  ) THEN
    ALTER TABLE inventory_movements RENAME COLUMN user_id TO actor_id;
  END IF;
END $$;
