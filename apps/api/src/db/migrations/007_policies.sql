-- Requisitos por recurso (certificaciones exigidas) y políticas/condiciones
CREATE TABLE IF NOT EXISTS resource_required_certifications (
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  certification_id INT NOT NULL REFERENCES certifications(id) ON DELETE RESTRICT,
  PRIMARY KEY (resource_id, certification_id)
);

CREATE TABLE IF NOT EXISTS resource_policies (
  resource_id UUID PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
  terms TEXT,                -- condiciones/uso
  requirements_text TEXT     -- texto legible de requisitos (opcional)
);
