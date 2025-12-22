-- Backfill institution_id for all 8 tables
DO $$
DECLARE
  default_inst_id UUID;
  updated_count INT;
BEGIN
  -- Get default institution
  SELECT id INTO default_inst_id FROM institutions LIMIT 1;
  
  -- Update all tables
  UPDATE reading_sessions SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'reading_sessions: % rows updated', updated_count;
  
  UPDATE session_events SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'session_events: % rows updated', updated_count;
  
  UPDATE cornell_notes SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'cornell_notes: % rows updated', updated_count;
  
  UPDATE highlights SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'highlights: % rows updated', updated_count;
  
  UPDATE daily_goals SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'daily_goals: % rows updated', updated_count;
  
  UPDATE streaks SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'streaks: % rows updated', updated_count;
  
  UPDATE user_badges SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'user_badges: % rows updated', updated_count;
  
  UPDATE user_vocabularies SET institution_id = default_inst_id WHERE institution_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'user_vocabularies: % rows updated', updated_count;
  
  RAISE NOTICE 'Backfill complete!';
END $$;

-- Validate
SELECT 
  'reading_sessions' as table_name, COUNT(*) FILTER (WHERE institution_id IS NULL) as null_count
FROM reading_sessions
UNION ALL
SELECT 'session_events', COUNT(*) FILTER (WHERE institution_id IS NULL) FROM session_events
UNION ALL
SELECT 'user_vocabularies', COUNT(*) FILTER (WHERE institution_id IS NULL) FROM user_vocabularies
UNION ALL
SELECT 'cornell_notes', COUNT(*) FILTER (WHERE institution_id IS NULL) FROM cornell_notes
UNION ALL
SELECT 'highlights', COUNT(*) FILTER (WHERE institution_id IS NULL) FROM highlights
UNION ALL
SELECT 'daily_goals', COUNT(*) FILTER (WHERE institution_id IS NULL) FROM daily_goals
UNION ALL
SELECT 'streaks', COUNT(*) FILTER (WHERE institution_id IS NULL) FROM streaks
UNION ALL
SELECT 'user_badges', COUNT(*) FILTER (WHERE institution_id IS NULL) FROM user_badges;
