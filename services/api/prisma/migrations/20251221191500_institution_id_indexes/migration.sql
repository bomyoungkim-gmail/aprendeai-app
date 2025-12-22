-- Stage 4: Add composite indexes for tenant-aware queries
-- Phase 0: MVP-Hardening - Multi-Tenancy
-- Performance optimization for multi-tenant queries
-- Pattern: (institution_id, primary_filter_column)
-- 1. reading_sessions: Most queries filter by institution + user
CREATE INDEX idx_reading_sessions_tenant_user ON reading_sessions (institution_id, user_id);

-- 2. session_events: Queries join via reading_session + filter by tenant
CREATE INDEX idx_session_events_tenant_session ON session_events (institution_id, reading_session_id);

-- 3. user_vocabulary: Queries by user within institution
CREATE INDEX idx_user_vocabulary_tenant_user ON user_vocabulary (institution_id, user_id);

-- 4. cornell_notes: Content within institution + user
CREATE INDEX idx_cornell_notes_tenant_user ON cornell_notes (institution_id, user_id);

-- 5. highlights: Content within institution + user
CREATE INDEX idx_highlights_tenant_user ON highlights (institution_id, user_id);

-- 6. daily_goals: Goals within institution + user
CREATE INDEX idx_daily_goals_tenant_user ON daily_goals (institution_id, user_id);

-- 7. streaks: Streaks within institution + user
CREATE INDEX idx_streaks_tenant_user ON streaks (institution_id, user_id);

-- 8. user_badges: Badges within institution + user
CREATE INDEX idx_user_badges_tenant_user ON user_badges (institution_id, user_id);

-- Update PostgreSQL statistics for query planner
ANALYZE reading_sessions;

ANALYZE session_events;

ANALYZE user_vocabulary;

ANALYZE cornell_notes;

ANALYZE highlights;

ANALYZE daily_goals;

ANALYZE streaks;

ANALYZE user_badges;