-- Apply all institution_id columns manually
-- Run via: docker exec socrates-postgres psql -U postgres -d aprendeai -f /tmp/apply_institution_id.sql
-- 2. session_events  
ALTER TABLE session_events
ADD COLUMN IF NOT EXISTS institution_id UUID;

-- 3. user_vocabulary
ALTER TABLE user_vocabulary
ADD COLUMN IF NOT EXISTS institution_id UUID;

-- 4. cornell_notes
ALTER TABLE cornell_notes
ADD COLUMN IF NOT EXISTS institution_id UUID;

-- 5. highlights
ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS institution_id UUID;

-- 6. daily_goals
ALTER TABLE daily_goals
ADD COLUMN IF NOT EXISTS institution_id UUID;

-- 7. streaks
ALTER TABLE streaks
ADD COLUMN IF NOT EXISTS institution_id UUID;

-- 8. user_badges
ALTER TABLE user_badges
ADD COLUMN IF NOT EXISTS institution_id UUID;

-- Add foreign keys
ALTER TABLE reading_sessions ADD CONSTRAINT IF NOT EXISTS fk_reading_sessions_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE session_events ADD CONSTRAINT IF NOT EXISTS fk_session_events_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE user_vocabulary ADD CONSTRAINT IF NOT EXISTS fk_user_vocabulary_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE cornell_notes ADD CONSTRAINT IF NOT EXISTS fk_cornell_notes_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE highlights ADD CONSTRAINT IF NOT EXISTS fk_highlights_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE daily_goals ADD CONSTRAINT IF NOT EXISTS fk_daily_goals_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE streaks ADD CONSTRAINT IF NOT EXISTS fk_streaks_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

ALTER TABLE user_badges ADD CONSTRAINT IF NOT EXISTS fk_user_badges_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE SET NULL;

-- Add event_version column
ALTER TABLE session_events
ADD COLUMN IF NOT EXISTS event_version INTEGER NOT NULL DEFAULT 1;