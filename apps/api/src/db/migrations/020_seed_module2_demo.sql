
-- 020_seed_module2_demo.sql
-- Idempotent seed data to test Module 2 endpoints end-to-end.

-- Ensure extensions exist for gen_random_uuid and citext used by earlier migrations
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- 1) Basic lab
DO $$
DECLARE v_lab UUID;
BEGIN
  -- Create lab if missing
  IF NOT EXISTS (SELECT 1 FROM laboratories WHERE code='LAB-EL-01') THEN
    INSERT INTO laboratories (id, name, code, school, location, description)
    VALUES (gen_random_uuid(), 'Laboratorio de Electrónica', 'LAB-EL-01', 'Escuela de Ingeniería', 'Edificio A', 'Lab semilla para pruebas');
  END IF;
END$$;

-- 2) Users (TECH + ADMIN + TEACHER requester)
-- Password for all below: 'ClaveFuerte123'
DO $$
DECLARE v_exists INT;
BEGIN
  -- TECH
  SELECT COUNT(*) INTO v_exists FROM users WHERE lower(email) = 'tecnico@itcr.ac.cr';
  IF v_exists = 0 THEN
    INSERT INTO users (id, role, full_name, id_code, career_or_department, email, phone, password_hash)
    VALUES (gen_random_uuid(), 'TECH', 'Técnico Pruebas', 'TEC-0001', 'Depto Electrónica', 'tecnico@itcr.ac.cr', '8888-0001', '$2b$12$WbxnGDr6dHEhTqMGyi.jAOBOYvgnBOWiQ3w6nKA05lhH0st3G8eAq');
  END IF;

  -- ADMIN
  SELECT COUNT(*) INTO v_exists FROM users WHERE lower(email) = 'admin@tec.ac.cr';
  IF v_exists = 0 THEN
    INSERT INTO users (id, role, full_name, id_code, career_or_department, email, phone, password_hash)
    VALUES (gen_random_uuid(), 'ADMIN', 'Admin Plataforma', 'ADM-0001', 'Dirección', 'admin@tec.ac.cr', '8888-0002', '$2b$12$WbxnGDr6dHEhTqMGyi.jAOBOYvgnBOWiQ3w6nKA05lhH0st3G8eAq');
  END IF;

  -- TEACHER (solicitante de la reserva aprobada)
  SELECT COUNT(*) INTO v_exists FROM users WHERE lower(email) = 'docente@itcr.ac.cr';
  IF v_exists = 0 THEN
    INSERT INTO users (id, role, full_name, id_code, career_or_department, email, phone, password_hash)
    VALUES (gen_random_uuid(), 'teacher', 'Profesor Pruebas', 'PROF-0001', 'Escuela de Ingeniería', 'docente@itcr.ac.cr', '8888-0003', '$2b$12$WbxnGDr6dHEhTqMGyi.jAOBOYvgnBOWiQ3w6nKA05lhH0st3G8eAq');
  END IF;
END$$;

-- 3) Get lab id and teacher id into a temp table for reuse
DROP TABLE IF EXISTS tmp_ids;
CREATE TEMP TABLE tmp_ids AS
SELECT 
  (SELECT id FROM laboratories WHERE code='LAB-EL-01') AS lab_id,
  (SELECT id FROM users WHERE lower(email)='docente@itcr.ac.cr') AS teacher_id,
  (SELECT id FROM users WHERE lower(email)='tecnico@itcr.ac.cr') AS tech_id;

-- 4) Resources: one EQUIPO and one MATERIAL
DO $$
DECLARE v_lab UUID := (SELECT lab_id FROM tmp_ids);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM resources WHERE code='EQ-OSC-001') THEN
    INSERT INTO resources (id, lab_id, type, name, code, status, location, stock, min_stock)
    VALUES (gen_random_uuid(), v_lab, 'EQUIPO', 'Osciloscopio Tek', 'EQ-OSC-001', 'DISPONIBLE', 'Aula 1', 0, 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM resources WHERE code='MAT-GL-001') THEN
    INSERT INTO resources (id, lab_id, type, name, code, status, location, stock, min_stock)
    VALUES (gen_random_uuid(), v_lab, 'MATERIAL', 'Guantes Nitrilo', 'MAT-GL-001', 'DISPONIBLE', 'Bodega', 120, 50);
  END IF;
END$$;

-- 5) A request already approved with the two items above
DO $$
DECLARE 
  v_req UUID;
  v_lab UUID := (SELECT lab_id FROM tmp_ids);
  v_teacher UUID := (SELECT teacher_id FROM tmp_ids);
  v_eq UUID := (SELECT id FROM resources WHERE code='EQ-OSC-001');
  v_mat UUID := (SELECT id FROM resources WHERE code='MAT-GL-001');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM requests r 
    JOIN request_items ri ON ri.request_id = r.id
    WHERE r.status='APROBADA' AND r.user_id = v_teacher AND ri.resource_id = v_eq
  ) THEN
    INSERT INTO requests (id, user_id, lab_id, status, purpose, requested_at)
    VALUES (gen_random_uuid(), v_teacher, v_lab, 'APROBADA', 'Práctica de mediciones', now() - interval '1 day')
    RETURNING id INTO v_req;

    INSERT INTO request_items (id, request_id, resource_id, quantity)
    VALUES (gen_random_uuid(), v_req, v_eq, 1);

    INSERT INTO request_items (id, request_id, resource_id, quantity)
    VALUES (gen_random_uuid(), v_req, v_mat, 10);
  END IF;
END$$;

-- 6) Optional: a low-stock material to test /inventory/materials/low-stock
DO $$
DECLARE v_lab UUID := (SELECT lab_id FROM tmp_ids);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM resources WHERE code='MAT-ALC-001') THEN
    INSERT INTO resources (id, lab_id, type, name, code, status, location, stock, min_stock)
    VALUES (gen_random_uuid(), v_lab, 'MATERIAL', 'Alcohol Isopropílico', 'MAT-ALC-001', 'DISPONIBLE', 'Bodega', 5, 20);
  END IF;
END$$;

-- 7) Cleanup temp
DROP TABLE IF EXISTS tmp_ids;
