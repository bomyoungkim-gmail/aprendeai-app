-- Stage 1: Add nullable institution_id columns to 8 core tables
-- Phase 0: MVP-Hardening - Multi-Tenancy
-- Safe to run in production (zero-downtime, no data migration)
-- 1. reading_sessions
ALTER TABLE reading_sessions
ADD COLUMN institution_id UUID;

-- 2. session_events  
ALTER TABLE session_events
ADD COLUMN institution_id UUID;

-- 3. user_vocabulary
ALTER TABLE user_vocabulary
ADD COLUMN institution_id UUID;

-- 4. cornell_notes
ALTER TABLE cornell_notes
ADD COLUMN institution_id UUID;

-- 5. highlights
ALTER TABLE highlights
ADD COLUMN institution_id UUID;

-- 6. daily_goals
ALTER TABLE daily_goals
ADD COLUMN institution_id UUID;

-- 7. streaks
ALTER TABLE streaks
ADD COLUMN institution_id UUID;

-- 8. user_badges
ALTER TABLE user_badges
ADD COLUMN institution_id UUID;

-- Add foreign key constraints (nullable for now)
ALTER TABLE reading_sessions ADD CONSTRAINT fk_reading_sessions_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE session_events ADD CONSTRAINT fk_session_events_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE user_vocabulary ADD CONSTRAINT fk_user_vocabulary_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE cornell_notes ADD CONSTRAINT fk_cornell_notes_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE highlights ADD CONSTRAINT fk_highlights_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE daily_goals ADD CONSTRAINT fk_daily_goals_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE streaks ADD CONSTRAINT fk_streaks_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE user_badges ADD CONSTRAINT fk_user_badges_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;