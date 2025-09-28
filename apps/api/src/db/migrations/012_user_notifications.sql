CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- p.ej. 'reservation_status'
  title TEXT NOT NULL,              -- breve
  message TEXT,                     -- más detalle
  data JSONB,                       -- payload (ej: {reservation_id, old_status, new_status})
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, is_read, created_at DESC);
