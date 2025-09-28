-- =========================
-- MEJORAS A LA TABLA DE RECURSOS PARA MÓDULO 1.2
-- =========================

-- Agregar campos necesarios para el catálogo de recursos
ALTER TABLE resources ADD COLUMN IF NOT EXISTS inventory_code VARCHAR(80);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS state VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
  CHECK (state IN ('DISPONIBLE','RESERVADO','EN_MANTENIMIENTO','INACTIVO'));
ALTER TABLE resources ADD COLUMN IF NOT EXISTS location VARCHAR(160);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS last_maintenance DATE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS tech_sheet TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS max_loan_days INTEGER;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2);

-- Crear índice único para código de inventario por laboratorio
CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_lab_inventory_code 
ON resources(lab_id, inventory_code) 
WHERE inventory_code IS NOT NULL;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_resources_state ON resources(state);
CREATE INDEX IF NOT EXISTS idx_resources_public ON resources(is_public);
CREATE INDEX IF NOT EXISTS idx_resources_type_state ON resources(type, state);
CREATE INDEX IF NOT EXISTS idx_resources_lab_type ON resources(lab_id, type);
CREATE INDEX IF NOT EXISTS idx_resources_inventory_code ON resources(inventory_code);

-- Comentarios para documentación
COMMENT ON COLUMN resources.inventory_code IS 'Código de inventario único por laboratorio';
COMMENT ON COLUMN resources.state IS 'Estado actual del recurso';
COMMENT ON COLUMN resources.location IS 'Ubicación específica del recurso';
COMMENT ON COLUMN resources.last_maintenance IS 'Fecha del último mantenimiento';
COMMENT ON COLUMN resources.tech_sheet IS 'Ficha técnica del recurso';
COMMENT ON COLUMN resources.is_public IS 'Si el recurso está visible en el catálogo público';
COMMENT ON COLUMN resources.requires_approval IS 'Si requiere aprobación para solicitar';
COMMENT ON COLUMN resources.max_loan_days IS 'Máximo número de días para préstamo';
COMMENT ON COLUMN resources.daily_rate IS 'Tarifa diaria del recurso';
