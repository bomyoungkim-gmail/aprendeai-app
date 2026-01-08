-- Issues #9-10: Priority 3 Security Fixes

-- ============================================================
-- Issue #9: Join Code Expiration
-- ============================================================

-- Add expiration fields to families table
ALTER TABLE "families" ADD COLUMN "join_code_expires_at" TIMESTAMP(3);
ALTER TABLE "families" ADD COLUMN "join_code_created_at" TIMESTAMP(3);

-- ============================================================
-- Issue #10: Check Constraints
-- ============================================================

-- 1. item_bank.difficulty: must be between 0.0 and 1.0
ALTER TABLE "item_bank" ADD CONSTRAINT "check_difficulty_range"
CHECK (difficulty IS NULL OR (difficulty >= 0.0 AND difficulty <= 1.0));

-- 2. plans.price_cents: >= 0, and > 0 if not FREE
ALTER TABLE "plans" ADD CONSTRAINT "check_valid_pricing"
CHECK (
  price_cents >= 0 AND
  (type = 'FREE' OR price_cents > 0)
);

-- 3. subscriptions.current_period_end: must be future if ACTIVE
ALTER TABLE "subscriptions" ADD CONSTRAINT "check_active_period_future"
CHECK (
  status != 'ACTIVE' OR
  current_period_end > NOW()
);

-- 4. learner_profiles.daily_time_budget_min: must be > 0
ALTER TABLE "learner_profiles" ADD CONSTRAINT "check_positive_time_budget"
CHECK (daily_time_budget_min > 0);

-- Verification: Check for data that violates constraints
DO $$
DECLARE
  invalid_difficulty INT;
  invalid_pricing INT;
  invalid_periods INT;
  invalid_budgets INT;
BEGIN
  -- Check item_bank.difficulty
  SELECT COUNT(*) INTO invalid_difficulty
  FROM item_bank 
  WHERE difficulty IS NOT NULL AND (difficulty < 0.0 OR difficulty > 1.0);
  
  -- Check plans.price_cents
  SELECT COUNT(*) INTO invalid_pricing
  FROM plans 
  WHERE price_cents < 0 OR (type != 'FREE' AND price_cents = 0);
  
  -- Check subscriptions
  SELECT COUNT(*) INTO invalid_periods
  FROM subscriptions 
  WHERE status = 'ACTIVE' AND current_period_end <= NOW();
  
  -- Check learner_profiles
  SELECT COUNT(*) INTO invalid_budgets
  FROM learner_profiles 
  WHERE daily_time_budget_min <= 0;
  
  RAISE NOTICE 'Validation Results:';
  RAISE NOTICE '  Invalid difficulty values: %', invalid_difficulty;
  RAISE NOTICE '  Invalid pricing: %', invalid_pricing;
  RAISE NOTICE '  Invalid active periods: %', invalid_periods;
  RAISE NOTICE '  Invalid time budgets: %', invalid_budgets;
  
  IF invalid_difficulty > 0 OR invalid_pricing > 0 OR invalid_periods > 0 OR invalid_budgets > 0 THEN
    RAISE WARNING 'Some data violates constraints. Please fix before applying.';
  ELSE
    RAISE NOTICE 'All data is valid. Constraints applied successfully!';
  END IF;
END $$;
