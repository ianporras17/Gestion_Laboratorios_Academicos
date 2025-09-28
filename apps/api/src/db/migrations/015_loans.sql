-- 015_loans.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Préstamos de equipos (solicitudes + ciclo)
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,   -- fecha/hora de retiro planificado
  end_time   TIMESTAMPTZ NOT NULL,   -- fecha/hora de devolución planificada
  status TEXT NOT NULL CHECK (status IN (
    'requested',   -- creada por el usuario (pendiente de revisión)
    'approved',    -- aprobada por personal/teacher
    'picked_up',   -- retirado
    'returned',    -- devuelto (terminado)
    'rejected',    -- rechazada
    'cancelled',   -- cancelada por solicitante antes de retiro
    'overdue'      -- vencida sin devolución (opcional para futuro)
  )),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT loans_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_loans_resource_time
  ON loans(resource_id, start_time, end_time, status);

-- Evitar traslapes entre préstamos que bloquean el equipo
DO $$
BEGIN
  ALTER TABLE loans DROP CONSTRAINT IF EXISTS no_overlap_loans_active;
  ALTER TABLE loans ADD CONSTRAINT no_overlap_loans_active
    EXCLUDE USING GIST (
      resource_id WITH =,
      tstzrange(start_time, end_time, '[]') WITH &&
    )
    WHERE (status IN ('requested','approved','picked_up'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

-- Adjuntos del préstamo (opcional: foto de cédula, recibo, etc.)
CREATE TABLE IF NOT EXISTS loan_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loan_attachments_loan ON loan_attachments(loan_id);
