-- 011_patch_users_timestamps.sql

-- Asegura extensiones comunes (idempotente)
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Agregar created_at / updated_at si faltan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN created_at timestamptz;
    UPDATE public.users SET created_at = now() WHERE created_at IS NULL;
    ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT now();
    ALTER TABLE public.users ALTER COLUMN created_at SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at timestamptz;
    UPDATE public.users SET updated_at = now() WHERE updated_at IS NULL;
    ALTER TABLE public.users ALTER COLUMN updated_at SET DEFAULT now();
    ALTER TABLE public.users ALTER COLUMN updated_at SET NOT NULL;
  END IF;
END$$;

-- 2) Función y trigger para auto-actualizar updated_at en UPDATE (idempotente)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;
