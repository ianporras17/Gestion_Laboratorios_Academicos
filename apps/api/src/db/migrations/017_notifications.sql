CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  resource_id UUID REFERENCES resources(id),
  user_id UUID REFERENCES users(id),
  audience TEXT CHECK (audience IN ('SOLICITANTE','ENCARGADO','ADMIN')),
  type TEXT, -- e.g. 'RETRASO','PROBLEMA','LOW_STOCK','DISPONIBLE'
  message TEXT,
  created_at timestamptz NOT NULL DEFAULT now()
);
