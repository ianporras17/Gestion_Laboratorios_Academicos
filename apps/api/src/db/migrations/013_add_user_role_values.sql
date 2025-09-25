-- 013_add_user_role_values.sql
DO $$
BEGIN
  -- Asegura el tipo base (por si en entornos limpios aún no existe)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student','teacher');
  END IF;
END$$;

-- Agregar valores NUEVOS al enum, uno por uno y tolerando duplicados
DO $$
BEGIN
  BEGIN
    ALTER TYPE user_role ADD VALUE 'TECH';
  EXCEPTION WHEN duplicate_object THEN
    -- ya existe, ignorar
    NULL;
  END;

  BEGIN
    ALTER TYPE user_role ADD VALUE 'ADMIN';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;
