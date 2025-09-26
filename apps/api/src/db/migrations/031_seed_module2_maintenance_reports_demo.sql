
-- 031_seed_module2_maintenance_reports_demo.sql
-- Focused seed: adds movements and one maintenance entry for reports coverage.

BEGIN;

-- Reuse existing lab and EQ-OSC-001; if missing, create minimal records
INSERT INTO laboratories (code, name)
VALUES ('ELEC-01','Lab Electrónica')
ON CONFLICT (code) DO NOTHING;

WITH lab AS (SELECT id FROM laboratories WHERE code='ELEC-01' LIMIT 1)
INSERT INTO resources (lab_id, code, name, type, status, stock, min_stock, created_at, updated_at)
SELECT lab.id, 'EQ-OSC-001', 'Osciloscopio Tektronix', 'EQUIPO', 'DISPONIBLE', 0, 0, now(), now()
FROM lab
ON CONFLICT (code) DO NOTHING;

-- Movements burst to have data for reports windows
DO $$
DECLARE
  v_eq uuid;
BEGIN
  SELECT id INTO v_eq FROM resources WHERE code='EQ-OSC-001';
  IF v_eq IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='inventory_movements') THEN
    INSERT INTO inventory_movements (id, resource_id, type, movement_type, quantity, note, reference, created_at)
    VALUES
      (gen_random_uuid(), v_eq, 'OUT', 'OUT', 1, 'Uso laboratorio (seed)', 'seed-rpt', now() - interval '3 days'),
      (gen_random_uuid(), v_eq, 'IN',  'IN',  1, 'Devolución (seed)',       'seed-rpt', now() - interval '2 days'),
      (gen_random_uuid(), v_eq, 'OUT', 'OUT', 1, 'Uso laboratorio (seed)', 'seed-rpt', now() - interval '1 day');
  END IF;
END $$;

-- Maintenance (same dynamic approach as 040)
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
    v_cols := v_cols || ', scheduled_at'; v_vals := v_vals || ', now() + interval ''2 days''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=v_tbl AND column_name='note') THEN
    v_cols := v_cols || ', note'; v_vals := v_vals || ', ''Mantenimiento programado (seed reports)''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=v_tbl AND column_name='created_at') THEN
    v_cols := v_cols || ', created_at'; v_vals := v_vals || ', now()';
  END IF;

  EXECUTE format('INSERT INTO %I (%s) VALUES (%s)', v_tbl, v_cols, v_vals);
EXCEPTION WHEN others THEN NULL;
END $$;

COMMIT;
