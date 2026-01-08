-- Create table to track comparison outcomes for threshold optimization
CREATE TABLE IF NOT EXISTS graph_comparison_outcomes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  had_changes BOOLEAN NOT NULL,
  recorded_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_graph_comparison_outcomes_user_id 
ON graph_comparison_outcomes(user_id);

CREATE INDEX IF NOT EXISTS idx_graph_comparison_outcomes_recorded_at 
ON graph_comparison_outcomes(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_graph_comparison_outcomes_user_recorded 
ON graph_comparison_outcomes(user_id, recorded_at DESC);