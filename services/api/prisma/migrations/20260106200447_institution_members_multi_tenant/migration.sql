-- Issue #6: Institution Members Multi-Tenant Support
-- Remove user_id unique constraint to allow users in multiple institutions

-- Step 1: Verify no duplicate (institution_id, user_id) pairs exist
DO $$
DECLARE
  duplicate_count INT;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT institution_id, user_id, COUNT(*) as cnt
    FROM institution_members
    GROUP BY institution_id, user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION '% duplicate (institution_id, user_id) pairs found! Manual cleanup required.', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicates found. Safe to proceed.';
  END IF;
END $$;

-- Step 2: Drop existing user_id unique constraint
ALTER TABLE "institution_members" DROP CONSTRAINT IF EXISTS "institution_members_user_id_key";

-- Step 3: Create composite unique constraint
CREATE UNIQUE INDEX "institution_members_institution_id_user_id_key" 
ON "institution_members"(institution_id, user_id);

-- Step 4: Create index on user_id for performance (findFirst queries)
CREATE INDEX IF NOT EXISTS "institution_members_user_id_idx" 
ON "institution_members"(user_id);

-- Verification
DO $$
DECLARE
  user_multi_institution_count INT;
BEGIN
  -- Count users in multiple institutions (should be 0 initially, but allowed now)
  SELECT COUNT(DISTINCT user_id) INTO user_multi_institution_count
  FROM (
    SELECT user_id, COUNT(DISTINCT institution_id) as inst_count
    FROM institution_members
    WHERE status = 'ACTIVE'
    GROUP BY user_id
    HAVING COUNT(DISTINCT institution_id) > 1
  ) multi_inst_users;
  
  RAISE NOTICE 'Users in multiple institutions: %', user_multi_institution_count;
  RAISE NOTICE 'Multi-tenant support enabled successfully!';
END $$;
