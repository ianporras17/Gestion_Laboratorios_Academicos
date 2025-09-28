-- =========================
-- MÓDULO 1.1: GESTIÓN DE PERFILES DE LABORATORIO
-- =========================

-- Extender tabla labs con campos del perfil
ALTER TABLE labs ADD COLUMN IF NOT EXISTS internal_code VARCHAR(60) UNIQUE;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS school_dept_id UUID REFERENCES school_departments(id);
ALTER TABLE labs ADD COLUMN IF NOT EXISTS email_contact VARCHAR(160) NOT NULL DEFAULT '';
ALTER TABLE labs ADD COLUMN IF NOT EXISTS capacity_max INTEGER;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Tabla de responsables del laboratorio
CREATE TABLE IF NOT EXISTS lab_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  full_name VARCHAR(160) NOT NULL,
  position_title VARCHAR(120) NOT NULL,        -- encargado/técnico
  phone VARCHAR(40),
  email VARCHAR(160) NOT NULL,                -- institucional
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de políticas internas del laboratorio
CREATE TABLE IF NOT EXISTS lab_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  academic_req TEXT,                          -- cursos previos/inducción
  safety_req TEXT,                            -- requisitos de seguridad
  notes TEXT,                                 -- notas adicionales
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Horarios de funcionamiento (bloques recurrentes)
CREATE TABLE IF NOT EXISTS lab_open_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Domingo
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lab_id, weekday, time_start, time_end)
);

-- Historial de actividades del laboratorio
CREATE TABLE IF NOT EXISTS lab_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id),
  action_type VARCHAR(60) NOT NULL,    -- reserva_creada, manten_prog, inventario_mov, etc.
  ref_table VARCHAR(60),               -- nombre tabla relacionada
  ref_id UUID,                         -- ID del registro relacionado
  detail TEXT,                         -- descripción detallada
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_lab_responsibles_lab ON lab_responsibles(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_responsibles_primary ON lab_responsibles(lab_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_lab_policies_lab ON lab_policies(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_open_hours_lab ON lab_open_hours(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_open_hours_weekday ON lab_open_hours(lab_id, weekday);
CREATE INDEX IF NOT EXISTS idx_lab_history_lab ON lab_history(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_history_actor ON lab_history(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_lab_history_created ON lab_history(created_at);
CREATE INDEX IF NOT EXISTS idx_labs_school_dept ON labs(school_dept_id);
CREATE INDEX IF NOT EXISTS idx_labs_internal_code ON labs(internal_code);
CREATE INDEX IF NOT EXISTS idx_labs_active ON labs(is_active);

-- Triggers para updated_at
DO $$ BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'set_updated_at';
  IF FOUND THEN
    DROP TRIGGER IF EXISTS lab_responsibles_set_updated_at ON lab_responsibles;
    CREATE TRIGGER lab_responsibles_set_updated_at
    BEFORE UPDATE ON lab_responsibles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS lab_policies_set_updated_at ON lab_policies;
    CREATE TRIGGER lab_policies_set_updated_at
    BEFORE UPDATE ON lab_policies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Comentarios para documentación
COMMENT ON TABLE lab_responsibles IS 'Responsables y contactos del laboratorio';
COMMENT ON TABLE lab_policies IS 'Políticas internas, requisitos académicos y de seguridad';
COMMENT ON TABLE lab_open_hours IS 'Horarios de funcionamiento del laboratorio';
COMMENT ON TABLE lab_history IS 'Historial cronológico de actividades del laboratorio';

COMMENT ON COLUMN lab_responsibles.position_title IS 'Cargo: encargado, técnico, coordinador, etc.';
COMMENT ON COLUMN lab_responsibles.is_primary IS 'Indica si es el responsable principal';
COMMENT ON COLUMN lab_open_hours.weekday IS '0=Domingo, 1=Lunes, ..., 6=Sábado';
COMMENT ON COLUMN lab_history.action_type IS 'Tipo de acción: reserva_creada, manten_prog, inventario_mov, etc.';
COMMENT ON COLUMN lab_history.ref_table IS 'Tabla relacionada con la acción';
COMMENT ON COLUMN lab_history.ref_id IS 'ID del registro relacionado';
