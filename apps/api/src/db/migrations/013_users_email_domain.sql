-- 013_users_email_domain.sql
-- Restringe dominios de correo por rol: 
-- student -> @estudiante.tec.ac.cr
-- teacher, TECH -> @itcr.ac.cr
-- ADMIN -> @tec.ac.cr

CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conname = 'users_email_domain_chk'
      AND c.conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_email_domain_chk
      CHECK (
        (role = 'student' AND email ~* '^[^@]+@estudiante\.tec\.ac\.cr$')
     OR (role IN ('teacher','TECH') AND email ~* '^[^@]+@itcr\.ac\.cr$')
     OR (role = 'ADMIN' AND email ~* '^[^@]+@tec\.ac\.cr$')
      )
      NOT VALID;
  END IF;
END$$;


-- Si más adelante limpias los datos viejos, puedes validar todo el histórico:
-- ALTER TABLE public.users VALIDATE CONSTRAINT users_email_domain_chk;
