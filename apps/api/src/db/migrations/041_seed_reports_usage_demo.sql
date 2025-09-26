
-- 042_seed_reports_usage_demo_fix.sql
-- Ensures deliveries are inserted WITH delivered_by when the column is NOT NULL.
-- Uses dynamic column list based on schema to avoid failures.
-- Idempotent and safe to re-run.

BEGIN;

-- Ensure base users exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email='docente@itcr.ac.cr') THEN
    INSERT INTO users (id, email, role, full_name, created_at)
    VALUES (gen_random_uuid(), 'docente@itcr.ac.cr', 'teacher', 'Docente Solicitante', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE email='tecnico@itcr.ac.cr') THEN
    INSERT INTO users (id, email, role, full_name, created_at)
    VALUES (gen_random_uuid(), 'tecnico@itcr.ac.cr', 'TECH', 'Técnico Encargado', now());
  END IF;
END $$;

-- Main block
DO $$
DECLARE
  v_lab UUID;
  v_teacher UUID;
  v_tech UUID;
  v_req UUID;
  v_eq UUID;
  v_mat1 UUID;
  v_mat2 UUID;
  has_delivered_by BOOLEAN;
  cols TEXT;
  vals TEXT;
BEGIN
  SELECT id INTO v_lab FROM laboratories WHERE code IN ('ELEC-01','LAB-EL-01') ORDER BY code='ELEC-01' DESC LIMIT 1;
  SELECT id INTO v_teacher FROM users WHERE email='docente@itcr.ac.cr' LIMIT 1;
  SELECT id INTO v_tech    FROM users WHERE email='tecnico@itcr.ac.cr' LIMIT 1;
  SELECT id INTO v_eq   FROM resources WHERE code='EQ-OSC-001' LIMIT 1;
  SELECT id INTO v_mat1 FROM resources WHERE code='MAT-GL-002' LIMIT 1;
  SELECT id INTO v_mat2 FROM resources WHERE code='MAT-ALC-002' LIMIT 1;

  IF v_lab IS NULL OR v_teacher IS NULL OR v_eq IS NULL OR v_tech IS NULL THEN
    RAISE NOTICE 'Missing lab/teacher/tech/resource, skipping 042 seed';
    RETURN;
  END IF;

  -- Ensure APROBADA request
  SELECT id INTO v_req FROM requests
   WHERE user_id=v_teacher AND lab_id=v_lab AND status='APROBADA'
   ORDER BY requested_at DESC LIMIT 1;

  IF v_req IS NULL THEN
    v_req := gen_random_uuid();
    INSERT INTO requests (id, user_id, lab_id, status, requested_at)
    VALUES (v_req, v_teacher, v_lab, 'APROBADA', now() - interval '1 day');
  END IF;

  -- Ensure request_items
  IF NOT EXISTS (SELECT 1 FROM request_items WHERE request_id=v_req AND resource_id=v_eq) THEN
    INSERT INTO request_items (id, request_id, resource_id, quantity)
    VALUES (gen_random_uuid(), v_req, v_eq, 1);
  END IF;

  IF v_mat1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM request_items WHERE request_id=v_req AND resource_id=v_mat1) THEN
    INSERT INTO request_items (id, request_id, resource_id, quantity)
    VALUES (gen_random_uuid(), v_req, v_mat1, 2);
  END IF;

  IF v_mat2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM request_items WHERE request_id=v_req AND resource_id=v_mat2) THEN
    INSERT INTO request_items (id, request_id, resource_id, quantity)
    VALUES (gen_random_uuid(), v_req, v_mat2, 1);
  END IF;

  -- Detect delivered_by column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='deliveries' AND column_name='delivered_by'
  ) INTO has_delivered_by;

  -- Insert 3 deliveries only if none exist yet, with dynamic column list
  IF NOT EXISTS (SELECT 1 FROM deliveries WHERE request_id=v_req) THEN
    IF has_delivered_by THEN
      cols := 'id, request_id, delivered_by, created_at';
      -- three rows
      EXECUTE format(
        'INSERT INTO deliveries (%s) VALUES (%s), (%s), (%s)',
        cols,
        format('gen_random_uuid(), ''%s'', ''%s'', now() - interval ''2 days''', v_req, v_tech),
        format('gen_random_uuid(), ''%s'', ''%s'', now() - interval ''1 day''', v_req, v_tech),
        format('gen_random_uuid(), ''%s'', ''%s'', now()', v_req, v_tech)
      );
    ELSE
      cols := 'id, request_id, created_at';
      EXECUTE format(
        'INSERT INTO deliveries (%s) VALUES (%s), (%s), (%s)',
        cols,
        format('gen_random_uuid(), ''%s'', now() - interval ''2 days''', v_req),
        format('gen_random_uuid(), ''%s'', now() - interval ''1 day''', v_req),
        format('gen_random_uuid(), ''%s'', now()', v_req)
      );
    END IF;
  END IF;

  -- Attach items to each delivery deterministically
  WITH ds AS (
    SELECT id, created_at, ROW_NUMBER() OVER (ORDER BY created_at) rn
    FROM deliveries WHERE request_id=v_req ORDER BY created_at
  )
  INSERT INTO delivery_items (id, delivery_id, resource_id, quantity)
  SELECT gen_random_uuid(), id, v_eq, 1 FROM ds WHERE rn=1
  ON CONFLICT DO NOTHING;

  WITH ds AS (
    SELECT id, created_at, ROW_NUMBER() OVER (ORDER BY created_at) rn
    FROM deliveries WHERE request_id=v_req ORDER BY created_at
  )
  INSERT INTO delivery_items (id, delivery_id, resource_id, quantity)
  SELECT gen_random_uuid(), id, v_mat1, 2 FROM ds WHERE rn=2 AND v_mat1 IS NOT NULL
  ON CONFLICT DO NOTHING;

  WITH ds AS (
    SELECT id, created_at, ROW_NUMBER() OVER (ORDER BY created_at) rn
    FROM deliveries WHERE request_id=v_req ORDER BY created_at
  )
  INSERT INTO delivery_items (id, delivery_id, resource_id, quantity)
  SELECT gen_random_uuid(), id, v_mat2, 1 FROM ds WHERE rn=3 AND v_mat2 IS NOT NULL
  ON CONFLICT DO NOTHING;

END $$;

COMMIT;
