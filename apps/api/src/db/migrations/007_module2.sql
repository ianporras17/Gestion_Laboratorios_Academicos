-- 0007_module2.sql
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type_enum') THEN
        CREATE TYPE movement_type_enum AS ENUM ('IN','OUT','ADJUST','MAINTENANCE_OUT','MAINTENANCE_IN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maint_type_enum') THEN
        CREATE TYPE maint_type_enum AS ENUM ('PREVENTIVO','CORRECTIVO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maint_result_enum') THEN
        CREATE TYPE maint_result_enum AS ENUM ('OK','INACTIVAR','OBSERVACION');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  type movement_type_enum NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  reason TEXT,
  ref_table TEXT,
  ref_id UUID,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_mov_resource ON inventory_movements(resource_id);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id),
  delivered_by UUID NOT NULL REFERENCES users(id),
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id),
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  received_by UUID NOT NULL REFERENCES users(id),
  returned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  condition TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id),
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  lab_id UUID NOT NULL REFERENCES laboratories(id),
  type maint_type_enum NOT NULL,
  scheduled_at TIMESTAMPTZ,
  performed_at TIMESTAMPTZ,
  technician_id UUID REFERENCES users(id),
  used_materials JSONB DEFAULT '[]'::jsonb,
  result maint_result_enum,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maint_res ON maintenances(resource_id);