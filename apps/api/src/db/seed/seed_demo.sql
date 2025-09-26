-- apps/api/src/db/seed/seed_demo.sql
DO $$
DECLARE
  v_lab UUID;
  v_res UUID;
  v_cert_id INT;
  v_user UUID;
  v_start TIMESTAMPTZ;
  v_end   TIMESTAMPTZ;
BEGIN
  -- 1) Lab
  SELECT id INTO v_lab FROM labs WHERE name='Lab Química' LIMIT 1;
  IF v_lab IS NULL THEN
    INSERT INTO labs(name, location, description)
    VALUES ('Lab Química','Edificio A - Piso 2','Laboratorio de Química')
    RETURNING id INTO v_lab;
  END IF;

  -- 2) Recurso
  SELECT id INTO v_res FROM resources WHERE name='Campana #1' LIMIT 1;
  IF v_res IS NULL THEN
    INSERT INTO resources(lab_id, type, name, description)
    VALUES (v_lab, 'campana-extraccion', 'Campana #1', 'Campana de extracción de gases')
    RETURNING id INTO v_res;
  END IF;

  -- 3) Certificación requerida
  INSERT INTO certifications(code, name)
  VALUES ('SEG-LAB-INDUCCION', 'Inducción de Seguridad')
  ON CONFLICT (code) DO NOTHING;

  SELECT id INTO v_cert_id FROM certifications WHERE code='SEG-LAB-INDUCCION';

  INSERT INTO resource_required_certifications(resource_id, certification_id)
  SELECT v_res, v_cert_id
  WHERE NOT EXISTS (
    SELECT 1 FROM resource_required_certifications
    WHERE resource_id=v_res AND certification_id=v_cert_id
  );

  -- 4) Políticas del recurso
  INSERT INTO resource_policies(resource_id, terms, requirements_text)
  VALUES (
    v_res,
    'Uso obligatorio de gafas, bata y guantes. Reservas con 24h de antelación.',
    'Requiere certificación SEG-LAB-INDUCCION.'
  )
  ON CONFLICT (resource_id) DO UPDATE
  SET terms=EXCLUDED.terms, requirements_text=EXCLUDED.requirements_text;

  -- 5) Reserva de ejemplo (hoy 10:00-11:00) con el primer usuario
  SELECT id INTO v_user FROM users ORDER BY created_at ASC LIMIT 1;
  IF v_user IS NOT NULL THEN
    v_start := date_trunc('day', now()) + interval '10 hour';
    v_end   := date_trunc('day', now()) + interval '11 hour';

    -- Inserta solo si no existe una reserva en ese rango para este recurso
    IF NOT EXISTS (
      SELECT 1 FROM reservations
      WHERE resource_id=v_res
        AND status IN ('pending','approved')
        AND start_time < v_end AND end_time > v_start
    ) THEN
      INSERT INTO reservations(resource_id, user_id, start_time, end_time, status)
      VALUES (v_res, v_user, v_start, v_end, 'approved');
    END IF;
  END IF;
END$$;
