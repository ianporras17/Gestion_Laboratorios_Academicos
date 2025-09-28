-- 008_reservations.sql  (idempotente)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tabla de reservas (creación si no existe)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- Normaliza los posibles valores de status y agrega 'in_review'
DO $$
BEGIN
  ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
  ALTER TABLE reservations
    ADD CONSTRAINT reservations_status_check
    CHECK (status IN ('in_review','pending','approved','rejected','cancelled'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

-- Índice por tiempo
CREATE INDEX IF NOT EXISTS idx_reservations_resource_time
  ON reservations(resource_id, start_time, end_time, status);

-- Constraint anti-traslape para estados que bloquean el recurso
DO $$
BEGIN
  ALTER TABLE reservations DROP CONSTRAINT IF EXISTS no_overlap_inreview_pending_approved;
  ALTER TABLE reservations ADD CONSTRAINT no_overlap_inreview_pending_approved
    EXCLUDE USING GIST (
      resource_id WITH =,
      tstzrange(start_time, end_time, '[]') WITH &&
    )
    WHERE (status IN ('in_review','pending','approved'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;