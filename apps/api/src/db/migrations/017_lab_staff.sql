CREATE TABLE IF NOT EXISTS lab_staff (
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','tech')),
  PRIMARY KEY (lab_id, user_id)
);
