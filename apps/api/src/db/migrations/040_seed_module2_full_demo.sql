
-- 040_seed_module2_full_demo.sql (FIXED - no hard dependency on `unit` column)
-- End-to-end demo seed for Módulo 2: Inventory + Movements + Maintenance.
-- Idempotent across schemas where `resources.unit` may not exist.

BEGIN;

-- === LAB ===
INSERT INTO laboratories (id, code, name)
VALUES ('87302ef1-11f7-40b1-bc6b-9987746d2b4b','ELEC-01','Lab Electrónica')
ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name;

-- === EQUIPMENT ===
WITH lab AS (SELECT id FROM laboratories WHERE code='ELEC-01' LIMIT 1)
INSERT INTO resources (id, lab_id, code, name, type, status, stock, min_stock, created_at, updated_at)
SELECT 'ab431216-410d-4be1-bf52-0f5e43bcaf60', lab.id, 'EQ-OSC-001', 'Osciloscopio Tektronix', 'EQUIPO', 'DISPONIBLE', 0, 0, now(), now()
FROM lab
ON CONFLICT (code) DO UPDATE SET name='Osciloscopio Tektronix';

WITH lab AS (SELECT id FROM laboratories WHERE code='ELEC-01' LIMIT 1)
INSERT INTO resources (id, lab_id, code, name, type, status, stock, min_stock, created_at, updated_at)
SELECT gen_random_uuid(), lab.id, 'EQ-FTE-001', 'Fuente DC Rigol', 'EQUIPO', 'DISPONIBLE', 0, 0, now(), now()
FROM lab
ON CONFLICT (code) DO NOTHING;

-- === MATERIALS ===
-- Insert using dynamic column list to avoid failing if `unit` doesn't exist
DO $$
DECLARE
  v_lab uuid;
  has_unit boolean;
  cols text;
  vals text;
BEGIN
  SELECT id INTO v_lab FROM laboratories WHERE code='ELEC-01' LIMIT 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='resources' AND column_name='unit'
  ) INTO has_unit;

  -- MAT-GL-002
  cols := 'id, lab_id, code, name, type, stock, min_stock, created_at, updated_at';
  vals := format('gen_random_uuid(), ''%s'', ''MAT-GL-002'', ''Guantes de Nitrilo'', ''MATERIAL'', 30, 10, now(), now()', v_lab);
  IF has_unit THEN
    cols := 'id, lab_id, code, name, type, unit, stock, min_stock, created_at, updated_at';
    vals := format('gen_random_uuid(), ''%s'', ''MAT-GL-002'', ''Guantes de Nitrilo'', ''MATERIAL'', ''unidad'', 30, 10, now(), now()', v_lab);
  END IF;

  EXECUTE format('INSERT INTO resources (%s) VALUES (%s) ON CONFLICT (code) DO NOTHING', cols, vals);

  -- MAT-ALC-002 (low stock)
  cols := 'id, lab_id, code, name, type, stock, min_stock, created_at, updated_at';
  vals := format('gen_random_uuid(), ''%s'', ''MAT-ALC-002'', ''Alcohol 70%%'', ''MATERIAL'', 5, 10, now(), now()', v_lab);
  IF has_unit THEN
    cols := 'id, lab_id, code, name, type, unit, stock, min_stock, created_at, updated_at';
    vals := format('gen_random_uuid(), ''%s'', ''MAT-ALC-002'', ''Alcohol 70%%'', ''MATERIAL'', ''ml'', 5, 10, now(), now()', v_lab);
  END IF;

  EXECUTE format('INSERT INTO resources (%s) VALUES (%s) ON CONFLICT (code) DO NOTHING', cols, vals);
END $$;

-- === SAMPLE MOVEMENTS ===
DO $$
DECLARE
  v_equipment_id uuid;
  v_gloves_id uuid;
  v_alcohol_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='inventory_movements') THEN
    SELECT id INTO v_equipment_id FROM resources WHERE code='EQ-OSC-001';
    SELECT id INTO v_gloves_id   FROM resources WHERE code='MAT-GL-002';
    SELECT id INTO v_alcohol_id  FROM resources WHERE code='MAT-ALC-002';

    IF v_equipment_id IS NOT NULL THEN
      INSERT INTO inventory_movements (id, resource_id, type, movement_type, quantity, note, reference, created_at)
      VALUES (gen_random_uuid(), v_equipment_id, 'OUT', 'OUT', 1, 'Salida de prueba (seed)', 'seed-demo', now())
      ON CONFLICT DO NOTHING;

      INSERT INTO inventory_movements (id, resource_id, type, movement_type, quantity, note, reference, created_at)
      VALUES (gen_random_uuid(), v_equipment_id, 'IN', 'IN', 1, 'Entrada de prueba (seed)', 'seed-demo', now())
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_gloves_id IS NOT NULL THEN
      INSERT INTO inventory_movements (id, resource_id, type, movement_type, quantity, note, reference, created_at)
      VALUES (gen_random_uuid(), v_gloves_id, 'IN', 'IN', 10, 'Reposición guantes (seed)', 'seed-demo', now())
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_alcohol_id IS NOT NULL THEN
      INSERT INTO inventory_movements (id, resource_id, type, movement_type, quantity, note, reference, created_at)
      VALUES (gen_random_uuid(), v_alcohol_id, 'OUT', 'OUT', 2, 'Consumo alcohol (seed)', 'seed-demo', now())
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- === MAINTENANCE ===
DO $$
DECLARE
  v_eq uuid;
  v_tbl text := NULL;
  v_cols text := '';
  v_vals text := '';
BEGIN
  SELECT id INTO v_eq FROM resources WHERE code='EQ-OSC-001';
  IF v_eq IS NULL THEN RETURN; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='maintenances') THEN
    v_tbl := 'maintenances';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='maintenance') THEN
    v_tbl := 'maintenance';
  ELSE
    RETURN;
  END IF;

  v_cols := 'id, resource_id'; v_vals := 'gen_random_uuid(), '''||v_eq||'''';

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=v_tbl AND column_name='status') THEN
    v_cols := v_cols || ', status'; v_vals := v_vals || ', ''PROGRAMADA''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=v_tbl AND column_name='scheduled_at') THEN
    v_cols := v_cols || ', scheduled_at'; v_vals := v_vals || ', now() + interval ''1 day''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=v_tbl AND column_name='note') THEN
    v_cols := v_cols || ', note'; v_vals := v_vals || ', ''Mantenimiento preventivo (seed)''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=v_tbl AND column_name='created_at') THEN
    v_cols := v_cols || ', created_at'; v_vals := v_vals || ', now()';
  END IF;

  EXECUTE format('INSERT INTO %I (%s) VALUES (%s)', v_tbl, v_cols, v_vals);
EXCEPTION WHEN others THEN NULL;
END $$;

COMMIT;
