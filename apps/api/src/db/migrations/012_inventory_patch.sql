-- 012_inventory_patch.sql
-- Idempotente. Ajusta enums y columnas requeridas para 2.2 Inventario.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tipos requeridos (agrega valores si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='resource_status_enum') THEN
    CREATE TYPE resource_status_enum AS ENUM ('DISPONIBLE','RESERVADO','EN_MANTENIMIENTO','INACTIVO');
  END IF;
  -- Asegurar los cuatro estados
  BEGIN ALTER TYPE resource_status_enum ADD VALUE IF NOT EXISTS 'DISPONIBLE'; EXCEPTION WHEN duplicate_object THEN END;
  BEGIN ALTER TYPE resource_status_enum ADD VALUE IF NOT EXISTS 'RESERVADO'; EXCEPTION WHEN duplicate_object THEN END;
  BEGIN ALTER TYPE resource_status_enum ADD VALUE IF NOT EXISTS 'EN_MANTENIMIENTO'; EXCEPTION WHEN duplicate_object THEN END;
  BEGIN ALTER TYPE resource_status_enum ADD VALUE IF NOT EXISTS 'INACTIVO'; EXCEPTION WHEN duplicate_object THEN END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='resource_type_enum') THEN
    CREATE TYPE resource_type_enum AS ENUM ('EQUIPO','MATERIAL');
  END IF;
  BEGIN ALTER TYPE resource_type_enum ADD VALUE IF NOT EXISTS 'EQUIPO'; EXCEPTION WHEN duplicate_object THEN END;
  BEGIN ALTER TYPE resource_type_enum ADD VALUE IF NOT EXISTS 'MATERIAL'; EXCEPTION WHEN duplicate_object THEN END;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='movement_type_enum') THEN
    CREATE TYPE movement_type_enum AS ENUM ('IN','OUT');
  END IF;
END$$;

-- Tabla resources mínima
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='resources'
  ) THEN
    CREATE TABLE resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lab_id UUID NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
      type resource_type_enum NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,        -- código de inventario
      status resource_status_enum NOT NULL DEFAULT 'DISPONIBLE',
      location TEXT,                    -- ubicación física
      stock INTEGER NOT NULL DEFAULT 0, -- aplica a MATERIAL
      min_stock INTEGER NOT NULL DEFAULT 0, -- umbral alerta
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END$$;

-- Asegurar columnas si la tabla ya existía
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='location')
    THEN ALTER TABLE resources ADD COLUMN location TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='stock')
    THEN ALTER TABLE resources ADD COLUMN stock INTEGER NOT NULL DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='min_stock')
    THEN ALTER TABLE resources ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='status')
    THEN ALTER TABLE resources ADD COLUMN status resource_status_enum NOT NULL DEFAULT 'DISPONIBLE'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='type')
    THEN ALTER TABLE resources ADD COLUMN type resource_type_enum NOT NULL DEFAULT 'EQUIPO'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='code')
    THEN ALTER TABLE resources ADD COLUMN code TEXT UNIQUE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='updated_at')
    THEN ALTER TABLE resources ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='created_at')
    THEN ALTER TABLE resources ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(); END IF;
END$$;

-- Trigger updated_at (si no existe)
CREATE OR REPLACE FUNCTION set_updated_at_res() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_resources_set_updated_at') THEN
    CREATE TRIGGER trg_resources_set_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_res();
  END IF;
END$$;

-- Movimientos de inventario (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='inventory_movements'
  ) THEN
    CREATE TABLE inventory_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      movement_type movement_type_enum NOT NULL, -- IN / OUT
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      reason TEXT,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_movements_resource ON inventory_movements(resource_id);
  END IF;
END$$;
