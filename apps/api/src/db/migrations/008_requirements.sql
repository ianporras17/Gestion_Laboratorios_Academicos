-- 008_requirements.sql

-- Enum idempotente
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='requirement_type_enum') THEN
    CREATE TYPE requirement_type_enum AS ENUM ('SEGURIDAD','INDUCCION','CURSO','OTRO');
  END IF;
END $$;

-- Para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crea certifications solo si no existe (no intenta cambiar su tipo si ya existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='certifications'
  ) THEN
    CREATE TABLE certifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );
  END IF;
END $$;

-- Detecta tipos reales y crea tablas dependientes sin comillas en los tipos
DO $do$
DECLARE
  cert_id_type  TEXT;
  users_id_type TEXT;
  labs_id_type  TEXT;
  ddl TEXT;
BEGIN
  -- tipos reales de las PKs
  SELECT format_type(a.atttypid, a.atttypmod) INTO cert_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.certifications'::regclass
    AND a.attname = 'id' AND a.attnum > 0;

  SELECT format_type(a.atttypid, a.atttypmod) INTO users_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.users'::regclass
    AND a.attname = 'id' AND a.attnum > 0;

  SELECT format_type(a.atttypid, a.atttypmod) INTO labs_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.laboratories'::regclass
    AND a.attname = 'id' AND a.attnum > 0;

  -- user_certifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='user_certifications'
  ) THEN
    ddl := format($SQL$
      CREATE TABLE user_certifications (
        user_id %s NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        certification_id %s NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
        obtained_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, certification_id)
      )
    $SQL$, users_id_type, cert_id_type);
    EXECUTE ddl;
  END IF;

  -- lab_requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='lab_requirements'
  ) THEN
    ddl := format($SQL$
      CREATE TABLE lab_requirements (
        lab_id %s NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
        certification_id %s NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
        requirement_type requirement_type_enum NOT NULL DEFAULT 'SEGURIDAD',
        PRIMARY KEY (lab_id, certification_id)
      )
    $SQL$, labs_id_type, cert_id_type);
    EXECUTE ddl;
  END IF;
END
$do$;
