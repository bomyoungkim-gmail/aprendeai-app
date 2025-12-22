-- Stage 3: Add NOT NULL constraints
-- Phase 0: MVP-Hardening - Multi-Tenancy
-- CRITICAL: Only run AFTER Stage 2 backfill is complete and validated
-- Validate with: SELECT COUNT(*) FROM table_name WHERE institution_id IS NULL;
-- Expected: 0 for all tables
ALTER TABLE reading_sessions
ALTER COLUMN institution_id
SET
  NOT NULL;

ALTER TABLE session_events
ALTER COLUMN institution_id
SET
  NOT NULL;

ALTER TABLE user_vocabulary
ALTER COLUMN institution_id
SET
  NOT NULL;

ALTER TABLE cornell_notes
ALTER COLUMN institution_id
SET
  NOT NULL;

ALTER TABLE highlights
ALTER COLUMN institution_id
SET
  NOT NULL;

ALTER TABLE daily_goals
ALTER COLUMN institution_id
SET
  NOT NULL;

ALTER TABLE streaks
ALTER COLUMN institution_id
SET
  NOT NULL;

ALTER TABLE user_badges
ALTER COLUMN institution_id
SET
  NOT NULL;