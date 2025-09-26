
-- 025_patch_notifications_created_by.sql
-- Align notifications schema with approved.controller notifyIssues() expectations.
-- Adds created_by (UUID, FK to users) and created_at timestamp for auditing.
-- Idempotent: safe to re-run.

BEGIN;

-- Add created_by column if missing
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add created_at column if missing
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create FK to users(id) only if it doesn't exist already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'notifications'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.constraint_name = 'notifications_created_by_fkey'
    ) THEN
        ALTER TABLE notifications
            ADD CONSTRAINT notifications_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Helpful index to query by creator
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_notifications_created_by'
          AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_notifications_created_by ON notifications(created_by);
    END IF;
END $$;

COMMIT;
