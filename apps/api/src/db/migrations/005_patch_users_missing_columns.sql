-- Agrega columnas faltantes en 'users' si no existen (id_code, career_or_department, phone, password_hash).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='id_code'
  ) THEN
    ALTER TABLE public.users ADD COLUMN id_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='career_or_department'
  ) THEN
    ALTER TABLE public.users ADD COLUMN career_or_department TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='password_hash'
  ) THEN
    ALTER TABLE public.users ADD COLUMN password_hash TEXT;
  END IF;
END$$;

-- (Opcional) Si quieres volverlas NOT NULL más adelante, primero asegura datos y luego:
-- ALTER TABLE public.users ALTER COLUMN id_code SET NOT NULL;
-- ALTER TABLE public.users ALTER COLUMN career_or_department SET NOT NULL;
-- ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;
