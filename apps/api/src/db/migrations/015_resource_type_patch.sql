DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='resource_type_enum') THEN
    CREATE TYPE resource_type_enum AS ENUM ('EQUIPO','CONSUMIBLE');
  END IF;
  BEGIN ALTER TYPE resource_type_enum ADD VALUE IF NOT EXISTS 'MATERIAL'; EXCEPTION WHEN duplicate_object THEN END;
END $$;
