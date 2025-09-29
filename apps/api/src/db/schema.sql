-- apps/api/src/db/schema.sql
-- =======================
-- MÓDULO 1.1
-- =======================

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email_domain TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS labs (
  id SERIAL PRIMARY KEY,
  department_id INT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_contacts (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_policies (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL UNIQUE REFERENCES labs(id) ON DELETE CASCADE,
  academic_requirements TEXT,
  safety_requirements TEXT,
  capacity_max INT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 0=Dom ... 6=Sáb
CREATE TABLE IF NOT EXISTS lab_hours (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  opens TIME NOT NULL,
  closes TIME NOT NULL,
  UNIQUE(lab_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS resources_fixed (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  inventory_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('DISPONIBLE','RESERVADO','MANTENIMIENTO','INACTIVO')),
  last_maintenance_date DATE,
  UNIQUE(lab_id, inventory_code)
);

CREATE TABLE IF NOT EXISTS consumables (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  reorder_point NUMERIC NOT NULL DEFAULT 0,
  qty_available NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lab_history (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id INT,
  action TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =======================
-- MÓDULO 1.2
-- =======================

CREATE TABLE IF NOT EXISTS resource_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  type_id INT NOT NULL REFERENCES resource_types(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  specs JSONB,
  status TEXT NOT NULL DEFAULT 'DISPONIBLE'
    CHECK(status IN ('DISPONIBLE','RESERVADO','MANTENIMIENTO','INACTIVO')),
  qty_available NUMERIC NOT NULL DEFAULT 1,
  request_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_photos (
  id SERIAL PRIMARY KEY,
  resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_slots (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  resource_id INT REFERENCES resources(id) ON DELETE CASCADE,
  starts_at TIMESTAMP NOT NULL,
  ends_at   TIMESTAMP NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('DISPONIBLE','RESERVADO','MANTENIMIENTO','INACTIVO','BLOQUEADO','EXCLUSIVO')),
  title TEXT,
  reason TEXT,
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slots_lab_time
  ON calendar_slots (lab_id, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_slots_resource_time
  ON calendar_slots (resource_id, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS availability_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  lab_id INT REFERENCES labs(id) ON DELETE CASCADE,
  resource_id INT REFERENCES resources(id) ON DELETE CASCADE,
  trigger_status TEXT NOT NULL DEFAULT 'DISPONIBLE'
    CHECK(trigger_status IN ('DISPONIBLE')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK ((lab_id IS NOT NULL) OR (resource_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  meta JSONB,
  queued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS changelog (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INT NOT NULL,
  user_id INT,
  action TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_changelog_entity
  ON changelog (entity_type, entity_id);


-- ================
-- 1.3 Solicitudes
-- ================

-- Solicitud principal
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_role TEXT NOT NULL,            -- estudiante/docente/...
  requester_program TEXT,                  -- carrera/departamento
  purpose TEXT NOT NULL,                   -- objetivo de uso
  priority TEXT NOT NULL DEFAULT 'NORMAL'  -- NORMAL/ALTA
    CHECK (priority IN ('NORMAL','ALTA')),
  requested_from TIMESTAMP NOT NULL,
  requested_to   TIMESTAMP NOT NULL,
  requirements_ok BOOLEAN NOT NULL DEFAULT FALSE,  -- validación automática
  status TEXT NOT NULL DEFAULT 'PENDIENTE'         -- PENDIENTE/APROBADA/RECHAZADA/NECESITA_INFO/CANCELADA
    CHECK (status IN ('PENDIENTE','APROBADA','RECHAZADA','NECESITA_INFO','CANCELADA')),
  reviewer_note TEXT,                      -- motivo rechazo o notas
  reviewer_id INT,                         -- futuro: user id quien aprueba
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ítems solicitados (recursos específicos y/o el espacio del lab)
CREATE TABLE IF NOT EXISTS request_items (
  id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  resource_id INT REFERENCES resources(id) ON DELETE SET NULL,  -- null => solo espacio del lab
  qty INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Mensajería simple para “Solicitar información adicional”
CREATE TABLE IF NOT EXISTS request_messages (
  id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('USUARIO','ENCARGADO')),
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- =========
-- MÓDULO 1.4
-- =========

-- Asignación de equipos (resources) o equipos fijos (resources_fixed) a una solicitud
CREATE TABLE IF NOT EXISTS resource_assignments (
  id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id INT,                            -- quién recibe (si no, requester de la solicitud)
  resource_id INT REFERENCES resources(id) ON DELETE SET NULL,       -- uno u otro
  fixed_id INT REFERENCES resources_fixed(id) ON DELETE SET NULL,
  qty NUMERIC NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ASIGNADO' CHECK(status IN ('ASIGNADO','DEVUELTO','PERDIDO','DANADO')),
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  due_at TIMESTAMP,                       -- fecha estimada de devolución
  returned_at TIMESTAMP,                  -- cuando se devuelve
  notes TEXT
);

-- Consumo de materiales (descuenta inventario de 'consumables')
CREATE TABLE IF NOT EXISTS material_consumptions (
  id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  consumable_id INT NOT NULL REFERENCES consumables(id) ON DELETE RESTRICT,
  qty NUMERIC NOT NULL CHECK(qty > 0),
  used_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used_by INT,
  notes TEXT
);

-- Beneficios académicos (horas, créditos, constancias)
CREATE TABLE IF NOT EXISTS academic_benefits (
  id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  lab_id INT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id INT NOT NULL,                   -- beneficiario
  hours NUMERIC DEFAULT 0,
  credits NUMERIC DEFAULT 0,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reportes: índices útiles
CREATE INDEX IF NOT EXISTS idx_assignments_lab ON resource_assignments (lab_id, assigned_at);
CREATE INDEX IF NOT EXISTS idx_consumptions_lab ON material_consumptions (lab_id, used_at);
CREATE INDEX IF NOT EXISTS idx_benefits_lab ON academic_benefits (lab_id, created_at);
