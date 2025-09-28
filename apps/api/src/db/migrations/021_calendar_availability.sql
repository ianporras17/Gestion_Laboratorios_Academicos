-- =========================
-- MÓDULO 1.2: PUBLICACIÓN DE DISPONIBILIDAD Y RECURSOS
-- =========================

-- Tabla de slots del calendario (pueden ser del LAB o de un RESOURCE concreto)
CREATE TABLE IF NOT EXISTS calendar_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
    CHECK (status IN ('DISPONIBLE','BLOQUEADO','RESERVADO','MANTENIMIENTO','EXCLUSIVO')),
  reason VARCHAR(160),                -- evento, mantenimiento, uso exclusivo, etc.
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- Suscripciones para avisos cuando se libere un recurso/espacio
CREATE TABLE IF NOT EXISTS availability_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id),
  resource_id UUID REFERENCES resources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lab_id, resource_id)
);

-- Bitácora de cambios sobre publicación/recursos
CREATE TABLE IF NOT EXISTS publish_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  lab_id UUID REFERENCES labs(id),
  resource_id UUID REFERENCES resources(id),
  field_name VARCHAR(80) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para fichas técnicas de recursos
CREATE TABLE IF NOT EXISTS resource_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  technical_sheet TEXT,               -- ficha técnica completa
  specifications JSONB,               -- especificaciones técnicas en JSON
  maintenance_notes TEXT,             -- notas de mantenimiento
  warranty_info TEXT,                 -- información de garantía
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para fotos de recursos
CREATE TABLE IF NOT EXISTS resource_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption VARCHAR(200),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para cantidades de consumibles
CREATE TABLE IF NOT EXISTS consumable_stock (
  resource_id UUID PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
  unit VARCHAR(40) NOT NULL,          -- p.ej. ml, g, piezas
  qty_available NUMERIC(14,3) NOT NULL DEFAULT 0,
  reorder_point NUMERIC(14,3) NOT NULL DEFAULT 0,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  move_type VARCHAR(10) NOT NULL CHECK (move_type IN ('IN','OUT')),
  qty NUMERIC(14,3) NOT NULL,
  moved_by UUID REFERENCES users(id),
  reason VARCHAR(160),                -- reabastecimiento, consumo, ajuste
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla para estados de disponibilidad y transiciones
CREATE TABLE IF NOT EXISTS availability_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  current_state VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
    CHECK (current_state IN ('DISPONIBLE','RESERVADO','EN_MANTENIMIENTO','INACTIVO')),
  previous_state VARCHAR(20),
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ             -- para estados temporales
);

-- Tabla para notificaciones de disponibilidad
CREATE TABLE IF NOT EXISTS availability_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id),
  resource_id UUID REFERENCES resources(id),
  notification_type VARCHAR(40) NOT NULL, -- 'RESOURCE_AVAILABLE', 'SLOT_AVAILABLE', 'MAINTENANCE_SCHEDULED'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_calendar_slots_lab_time ON calendar_slots(lab_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_resource_time ON calendar_slots(resource_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_status ON calendar_slots(status);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_date_range ON calendar_slots(starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_availability_subscriptions_user ON availability_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_subscriptions_lab ON availability_subscriptions(lab_id);
CREATE INDEX IF NOT EXISTS idx_availability_subscriptions_resource ON availability_subscriptions(resource_id);

CREATE INDEX IF NOT EXISTS idx_publish_changelog_lab ON publish_changelog(lab_id);
CREATE INDEX IF NOT EXISTS idx_publish_changelog_resource ON publish_changelog(resource_id);
CREATE INDEX IF NOT EXISTS idx_publish_changelog_created ON publish_changelog(created_at);

CREATE INDEX IF NOT EXISTS idx_resource_specs_resource ON resource_specs(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_photos_resource ON resource_photos(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_photos_primary ON resource_photos(resource_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_consumable_stock_resource ON consumable_stock(resource_id);
CREATE INDEX IF NOT EXISTS idx_consumable_stock_reorder ON consumable_stock(resource_id, qty_available, reorder_point);

CREATE INDEX IF NOT EXISTS idx_inventory_moves_resource ON inventory_moves(resource_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_moves_type ON inventory_moves(move_type, created_at);

CREATE INDEX IF NOT EXISTS idx_availability_states_resource ON availability_states(resource_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_availability_states_current ON availability_states(resource_id, current_state);

CREATE INDEX IF NOT EXISTS idx_availability_notifications_user ON availability_notifications(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_availability_notifications_unread ON availability_notifications(user_id, is_read, sent_at);

-- Triggers para updated_at
DO $$ BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'set_updated_at';
  IF FOUND THEN
    DROP TRIGGER IF EXISTS calendar_slots_set_updated_at ON calendar_slots;
    CREATE TRIGGER calendar_slots_set_updated_at
    BEFORE UPDATE ON calendar_slots FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS resource_specs_set_updated_at ON resource_specs;
    CREATE TRIGGER resource_specs_set_updated_at
    BEFORE UPDATE ON resource_specs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    DROP TRIGGER IF EXISTS consumable_stock_set_updated_at ON consumable_stock;
    CREATE TRIGGER consumable_stock_set_updated_at
    BEFORE UPDATE ON consumable_stock FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Comentarios para documentación
COMMENT ON TABLE calendar_slots IS 'Slots del calendario para laboratorios y recursos';
COMMENT ON TABLE availability_subscriptions IS 'Suscripciones para notificaciones de disponibilidad';
COMMENT ON TABLE publish_changelog IS 'Bitácora de cambios en publicación y recursos';
COMMENT ON TABLE resource_specs IS 'Fichas técnicas detalladas de recursos';
COMMENT ON TABLE resource_photos IS 'Fotos de recursos con metadatos';
COMMENT ON TABLE consumable_stock IS 'Control de stock para materiales consumibles';
COMMENT ON TABLE inventory_moves IS 'Movimientos de inventario';
COMMENT ON TABLE availability_states IS 'Estados de disponibilidad y transiciones';
COMMENT ON TABLE availability_notifications IS 'Notificaciones de disponibilidad';

COMMENT ON COLUMN calendar_slots.status IS 'Estado del slot: DISPONIBLE, BLOQUEADO, RESERVADO, MANTENIMIENTO, EXCLUSIVO';
COMMENT ON COLUMN calendar_slots.reason IS 'Motivo del bloqueo o reserva';
COMMENT ON COLUMN resource_specs.specifications IS 'Especificaciones técnicas en formato JSON';
COMMENT ON COLUMN consumable_stock.unit IS 'Unidad de medida: ml, g, piezas, etc.';
COMMENT ON COLUMN consumable_stock.reorder_point IS 'Punto de reorden para alertas';
COMMENT ON COLUMN inventory_moves.move_type IS 'Tipo de movimiento: IN (entrada), OUT (salida)';
COMMENT ON COLUMN availability_states.current_state IS 'Estado actual del recurso';
COMMENT ON COLUMN availability_states.previous_state IS 'Estado anterior del recurso';
COMMENT ON COLUMN availability_notifications.notification_type IS 'Tipo de notificación de disponibilidad';
