-- Data Correction Script for Issue #10 Check Constraints
-- This script ONLY fixes invalid data, no SELECTs
-- Fix plans: Set minimum price for non-FREE plans
UPDATE plans
SET
  price_cents = 100 -- $1.00 minimum
WHERE
  type != 'FREE'
  AND price_cents = 0;

-- Fix plans: Set negative prices to 0
UPDATE plans
SET
  price_cents = 0
WHERE
  price_cents < 0;

-- Fix item_bank: Clamp difficulty to valid range
UPDATE item_bank
SET
  difficulty = GREATEST (0.0, LEAST (1.0, difficulty))
WHERE
  difficulty IS NOT NULL
  AND (
    difficulty < 0.0
    OR difficulty > 1.0
  );

-- Fix subscriptions: Extend period for active subscriptions
UPDATE subscriptions
SET
  current_period_end = NOW () + INTERVAL '30 days'
WHERE
  status = 'ACTIVE'
  AND current_period_end <= NOW ();

-- Fix learner_profiles: Set minimum budget
UPDATE learner_profiles
SET
  daily_time_budget_min = 30 -- 30 minutes minimum
WHERE
  daily_time_budget_min <= 0;