-- Backfill institution_id for all tables
-- Get or create default institution
DO $$
DECLARE
  default_inst_id UUID;
BEGIN
  SELECT id INTO default_inst_id FROM institutions LIMIT 1;
  
  IF default_inst_id IS NULL THEN
    INSERT INTO institutions (name, type, city, country) 
    VALUES ('Default Institution', 'UNIVERSITY', 'Unknown', 'Unknown')
    RETURNING id INTO default_inst_id;
  END IF;
  
  -- Backfill tables
  UPDATE reading_sessions rs
  SET institution_id = COALESCE((SELECT institution_id FROM users WHERE id = rs.user_id), default_inst_id)
  WHERE institution_id IS NULL;
  
  UPDATE session_events se
  SET institution_id = COALESCE((SELECT institution_id FROM reading_sessions WHERE id = se.reading_session_id), default_inst_id)
  WHERE institution_id IS NULL;
  
  UPDATE cornell_notes cn
  SET institution_id = COALESCE((SELECT institution_id FROM users WHERE id = cn.user_id), default_inst_id)
  WHERE institution_id IS NULL;
  
  UPDATE highlights h
  SET institution_id = COALESCE((SELECT institution_id FROM users WHERE id = h.user_id), default_inst_id)
  WHERE institution_id IS NULL;
  
  UPDATE daily_goals dg
  SET institution_id = COALESCE((SELECT institution_id FROM users WHERE id = dg.user_id), default_inst_id)
  WHERE institution_id IS NULL;
  
  UPDATE streaks s
  SET institution_id = COALESCE((SELECT institution_id FROM users WHERE id = s.user_id), default_inst_id)
  WHERE institution_id IS NULL;
  
  UPDATE user_badges ub
  SET institution_id = COALESCE((SELECT institution_id FROM users WHERE id = ub.user_id), default_inst_id)
  WHERE institution_id IS NULL;
  
  UPDATE user_vocabularies uv
  SET institution_id = COALESCE((SELECT institution_id FROM users WHERE id = uv.user_id), default_inst_id)
  WHERE institution_id IS NULL;
END $$;
