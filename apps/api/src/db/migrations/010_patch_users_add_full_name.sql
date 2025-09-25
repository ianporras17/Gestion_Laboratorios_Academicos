-- Asegura extensiones comunes
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Agregar full_name si falta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='full_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name TEXT;
  END IF;
END$$;

-- 2) (Opcional pero recomendado para tus rutas de /api/approved)
-- Tu enum user_role al inicio solo tenía 'student','teacher'.
-- Agrega TECH y ADMIN para poder autenticar personal técnico/administrador.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='user_role') THEN
    CREATE TYPE user_role AS ENUM ('student','teacher','TECH','ADMIN');
  END IF;
END$$;

-- Si el tipo ya existe sin esos valores, añádelos:
DO $$
BEGIN
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TECH';
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
  END;
  BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
  END;
END$$;
