-- 014_backfill_history_from_reservations.sql
-- Inserta en el historial las reservas APROBADAS existentes (si aún no hay log)
DO $$
DECLARE
  rec RECORD;
  v_hours NUMERIC(6,2);
BEGIN
  FOR rec IN
    SELECT rv.id AS reservation_id, rv.user_id, rv.resource_id, rv.start_time, rv.end_time,
           r.lab_id
    FROM reservations rv
    JOIN resources r ON r.id = rv.resource_id
    WHERE rv.status = 'approved'
  LOOP
    v_hours := EXTRACT(EPOCH FROM (rec.end_time - rec.start_time)) / 3600.0;

    -- Evitar duplicados por reserva
    IF NOT EXISTS (
      SELECT 1 FROM user_activity_log
      WHERE reservation_id = rec.reservation_id
        AND activity_type = 'reservation_approved'
    ) THEN
      INSERT INTO user_activity_log(user_id, activity_type, event_time,
                                    lab_id, resource_id, reservation_id,
                                    hours, credits, meta)
      VALUES (rec.user_id, 'reservation_approved', rec.start_time,
              rec.lab_id, rec.resource_id, rec.reservation_id,
              ROUND(v_hours::numeric,2),
              ROUND((v_hours / 10.0)::numeric,2),               -- 1 crédito cada 10h (ajustable)
              jsonb_build_object('source','backfill_014'));
    END IF;
  END LOOP;
END$$;
