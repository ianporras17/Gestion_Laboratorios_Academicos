-- =========================
-- TABLA DE DEPARTAMENTOS ESCOLARES
-- =========================

-- Crear tabla de departamentos escolares si no existe
CREATE TABLE IF NOT EXISTS school_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  email_domain VARCHAR(120) NOT NULL UNIQUE,        -- p.ej. itcr.ac.cr, tec.ac.cr
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear índice para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_school_departments_name ON school_departments(name);
CREATE INDEX IF NOT EXISTS idx_school_departments_email_domain ON school_departments(email_domain);
CREATE INDEX IF NOT EXISTS idx_school_departments_active ON school_departments(is_active);

-- Trigger para updated_at
DO $$ BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'set_updated_at';
  IF FOUND THEN
    DROP TRIGGER IF EXISTS school_departments_set_updated_at ON school_departments;
    CREATE TRIGGER school_departments_set_updated_at
    BEFORE UPDATE ON school_departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Insertar algunos departamentos de ejemplo
INSERT INTO school_departments (name, email_domain, description) VALUES
('Escuela de Ingeniería en Computación', 'eic.cr', 'Departamento de Ingeniería en Computación'),
('Escuela de Ingeniería Electrónica', 'eie.cr', 'Departamento de Ingeniería Electrónica'),
('Escuela de Ingeniería Industrial', 'eii.cr', 'Departamento de Ingeniería Industrial'),
('Escuela de Química', 'eq.cr', 'Departamento de Química'),
('Escuela de Física', 'ef.cr', 'Departamento de Física'),
('Escuela de Matemática', 'em.cr', 'Departamento de Matemática')
ON CONFLICT (name) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE school_departments IS 'Departamentos o escuelas de la institución';
COMMENT ON COLUMN school_departments.email_domain IS 'Dominio de email institucional (ej: itcr.ac.cr)';
COMMENT ON COLUMN school_departments.is_active IS 'Indica si el departamento está activo';
