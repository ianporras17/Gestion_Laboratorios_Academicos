-- Laboratorios y recursos
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,            -- p.ej. "microscopio", "pc-alta", "impresora-3d"
  name TEXT NOT NULL,
  description TEXT,
  -- control de acceso por rol
  allowed_roles user_role[] NOT NULL DEFAULT ARRAY['student','teacher']::user_role[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_labs_location ON labs(location);
CREATE INDEX IF NOT EXISTS idx_resources_lab ON resources(lab_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);

-- Reusar trigger de updated_at si ya existe
DO $$ BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'set_updated_at';
  IF FOUND THEN
    DROP TRIGGER IF EXISTS labs_set_updated_at ON labs;
    CREATE TRIGGER labs_set_updated_at
    BEFORE UPDATE ON labs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS resources_set_updated_at ON resources;
    CREATE TRIGGER resources_set_updated_at
    BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
