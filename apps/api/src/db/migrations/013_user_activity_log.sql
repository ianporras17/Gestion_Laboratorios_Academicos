-- 013_user_activity_log.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Bitácora de actividades de usuario
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'reservation_created',
    'reservation_status_changed',
    'reservation_approved',
    'reservation_cancelled',
    'loan_created',
    'loan_returned',
    'training_completed'
  )),
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  lab_id UUID,
  resource_id UUID,
  reservation_id UUID,
  loan_id UUID,
  certification_id INT,
  hours NUMERIC(6,2) DEFAULT 0,     -- horas asociadas (p.ej., reservas aprobadas)
  credits NUMERIC(6,2) DEFAULT 0,   -- créditos (si aplica)
  meta JSONB                        -- datos adicionales
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_time
  ON user_activity_log(user_id, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_types
  ON user_activity_log(activity_type, event_time DESC);
