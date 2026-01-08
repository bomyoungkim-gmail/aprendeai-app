-- Issue #5: Enrollments Filtered Unique Index
-- Allow only ONE ACTIVE enrollment per student/classroom
-- But preserve historical records (REMOVED, WITHDRAWN, etc.)

-- Step 1: Drop current unique constraint (blocks historical enrollments)
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_classroom_id_learner_user_id_key";

-- Step 2: Create filtered unique index (only for ACTIVE enrollments)
CREATE UNIQUE INDEX "enrollments_active_unique_idx" 
ON "enrollments"(classroom_id, learner_user_id) 
WHERE status = 'ACTIVE';

-- Verification: List any duplicate ACTIVE enrollments that would violate new constraint
DO $$
DECLARE
  duplicate_count INT;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT classroom_id, learner_user_id, COUNT(*) as cnt
    FROM enrollments
    WHERE status = 'ACTIVE'
    GROUP BY classroom_id, learner_user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING '% duplicate ACTIVE enrollments found! Manual cleanup needed.', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate ACTIVE enrollments. Migration safe.';
  END IF;
END $$;