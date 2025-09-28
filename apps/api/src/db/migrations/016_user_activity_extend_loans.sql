-- 016_user_activity_extend_loans.sql
ALTER TABLE user_activity_log
  DROP CONSTRAINT IF EXISTS user_activity_log_activity_type_check;

ALTER TABLE user_activity_log
  ADD CONSTRAINT user_activity_log_activity_type_check
  CHECK (activity_type IN (
    'reservation_created',
    'reservation_status_changed',
    'reservation_approved',
    'reservation_cancelled',
    'loan_created',
    'loan_returned',
    'loan_cancelled',          -- 👈 nuevo
    'loan_status_changed',     -- 👈 nuevo
    'training_completed'
  ));
