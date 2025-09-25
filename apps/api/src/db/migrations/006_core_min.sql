-- 0006_core_min.sql
-- Minimal core to support Módulo 2 (users, labs, resources, requests)

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
        CREATE TYPE role_enum AS ENUM ('ADMIN','TECH','DOCENTE','ESTUDIANTE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type_enum') THEN
        CREATE TYPE resource_type_enum AS ENUM ('EQUIPO','CONSUMIBLE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_status_enum') THEN
        CREATE TYPE resource_status_enum AS ENUM ('DISPONIBLE','RESERVADO','EN_MANTENIMIENTO','INACTIVO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status_enum') THEN
        CREATE TYPE request_status_enum AS ENUM ('PENDIENTE','APROBADA','RECHAZADA','EN_REVISION','CANCELADA');
    END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role role_enum NOT NULL DEFAULT 'ESTUDIANTE',
  carrera TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  school TEXT,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
  type resource_type_enum NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  status resource_status_enum NOT NULL DEFAULT 'DISPONIBLE',
  specs JSONB DEFAULT '{}'::jsonb,
  last_maintenance_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resources_lab ON resources(lab_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

CREATE TABLE IF NOT EXISTS resource_stock (
  resource_id UUID PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unidad',
  reorder_point NUMERIC(12,3) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  lab_id UUID NOT NULL REFERENCES laboratories(id),
  status request_status_enum NOT NULL DEFAULT 'PENDIENTE',
  purpose TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id),
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_request_items_req ON request_items(request_id);