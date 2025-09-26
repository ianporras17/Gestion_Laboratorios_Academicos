-- Crea rangos OCUPADOS para probar disponibilidad/búsqueda.
-- Usa la zona horaria de Costa Rica (-06:00) en las marcas de tiempo.

DO $$
DECLARE
  v_lab   UUID;
  v_res   UUID;
  v_user  UUID;
  v_day   DATE := current_date;  -- cambia si quieres otra fecha: '2025-09-24'::date
  v_s1    TIMESTAMPTZ;
  v_e1    TIMESTAMPTZ;
  v_s2    TIMESTAMPTZ;
  v_e2    TIMESTAMPTZ;
BEGIN
  -- Asegura Lab y Recurso de demo:
  SELECT id INTO v_lab FROM labs WHERE name='Lab Química' LIMIT 1;
  IF v_lab IS NULL THEN
    INSERT INTO labs (name, location, description)
    VALUES ('Lab Química', 'Edificio A - Piso 2', 'Laboratorio de Química')
    RETURNING id INTO v_lab;
  END IF;

  SELECT id INTO v_res FROM resources WHERE name='Campana #1' LIMIT 1;
  IF v_res IS NULL THEN
    INSERT INTO resources (lab_id, type, name, description)
    VALUES (v_lab, 'campana-extraccion', 'Campana #1', 'Campana de extracción de gases')
    RETURNING id INTO v_res;
  END IF;

  -- Toma algún usuario (el primero). Si no hay usuarios, registra uno y vuelve a correr el seed.
  SELECT id INTO v_user FROM users ORDER BY created_at ASC LIMIT 1;
  IF v_user IS NULL THEN
    RAISE NOTICE 'No hay usuarios en la tabla users. Registra un usuario y vuelve a ejecutar este seed.';
    RETURN;
  END IF;

  -- Define dos rangos ocupados:
  -- 1) Hoy 10:00–11:00 (CR -06)
  v_s1 := (v_day::text || ' 10:00:00-06')::timestamptz;
  v_e1 := (v_day::text || ' 11:00:00-06')::timestamptz;

  -- 2) Hoy 15:00–16:30 (CR -06)
  v_s2 := (v_day::text || ' 15:00:00-06')::timestamptz;
  v_e2 := (v_day::text || ' 16:30:00-06')::timestamptz;

  -- Inserta solo si no hay traslape en cada rango (pending/approved)
  IF NOT EXISTS (
    SELECT 1 FROM reservations
     WHERE resource_id = v_res
       AND status IN ('pending','approved')
       AND start_time < v_e1 AND end_time > v_s1
  ) THEN
    INSERT INTO reservations (resource_id, user_id, start_time, end_time, status)
    VALUES (v_res, v_user, v_s1, v_e1, 'approved');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM reservations
     WHERE resource_id = v_res
       AND status IN ('pending','approved')
       AND start_time < v_e2 AND end_time > v_s2
  ) THEN
    INSERT INTO reservations (resource_id, user_id, start_time, end_time, status)
    VALUES (v_res, v_user, v_s2, v_e2, 'approved');
  END IF;

  RAISE NOTICE 'Seed busy: creado/asegurado Campana #1 con reservas en % 10:00-11:00 y 15:00-16:30 (CR -06)', v_day;
END$$;
