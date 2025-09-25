CREATE TABLE IF NOT EXISTS certifications (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_certifications (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certification_id INT NOT NULL REFERENCES certifications(id) ON DELETE RESTRICT,
  obtained_at DATE NOT NULL,
  PRIMARY KEY (user_id, certification_id)
);
