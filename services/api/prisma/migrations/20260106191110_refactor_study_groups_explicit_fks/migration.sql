/*
  Warnings:

  - You are about to drop the column `scope_id` on the `study_groups` table. All the data in the column will be lost.
  - You are about to drop the column `scope_type` on the `study_groups` table. All the data in the column will be lost.

*/

-- Step 1: Add new columns (nullable for migration)
ALTER TABLE "study_groups" 
ADD COLUMN "institution_id" TEXT,
ADD COLUMN "family_id" TEXT,
ADD COLUMN "personal_user_id" TEXT,
ADD COLUMN "scope_type_legacy" "ScopeType",
ADD COLUMN "scope_id_legacy" TEXT;

-- Step 2: Copy existing data to legacy columns
UPDATE "study_groups" 
SET scope_type_legacy = scope_type,
    scope_id_legacy = scope_id
WHERE scope_type IS NOT NULL;

-- Step 3: Populate new FK columns based on scope_type
-- Institution groups
UPDATE "study_groups"
SET institution_id = scope_id
WHERE scope_type = 'INSTITUTION' AND scope_id IS NOT NULL;

-- Family groups  
UPDATE "study_groups"
SET family_id = scope_id
WHERE scope_type = 'FAMILY' AND scope_id IS NOT NULL;

-- Personal user groups
UPDATE "study_groups"
SET personal_user_id = scope_id
WHERE scope_type = 'USER' AND scope_id IS NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "study_groups" 
DROP COLUMN IF EXISTS "scope_id",
DROP COLUMN IF EXISTS "scope_type";

-- Step 5: Drop old index
DROP INDEX IF EXISTS "study_groups_scope_type_scope_id_idx";

-- Step 6: Create new indexes
CREATE INDEX "study_groups_institution_id_idx" ON "study_groups"("institution_id");
CREATE INDEX "study_groups_family_id_idx" ON "study_groups"("family_id");
CREATE INDEX "study_groups_personal_user_id_idx" ON "study_groups"("personal_user_id");

-- Step 7: Add Foreign Key constraints
ALTER TABLE "study_groups" 
ADD CONSTRAINT "study_groups_institution_id_fkey" 
FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_groups" 
ADD CONSTRAINT "study_groups_family_id_fkey" 
FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_groups" 
ADD CONSTRAINT "study_groups_personal_user_id_fkey" 
FOREIGN KEY ("personal_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Add check constraint (only one scope can be set)
ALTER TABLE "study_groups" 
ADD CONSTRAINT "study_groups_single_scope_check"
CHECK (
  ((institution_id IS NOT NULL)::int + 
   (family_id IS NOT NULL)::int + 
   (personal_user_id IS NOT NULL)::int) <= 1
);

-- Verify migration
DO $$
DECLARE
  migrated_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM study_groups WHERE scope_type_legacy IS NOT NULL;
  SELECT COUNT(*) INTO migrated_count FROM study_groups 
  WHERE (institution_id IS NOT NULL OR family_id IS NOT NULL OR personal_user_id IS NOT NULL);
  
  IF total_count > 0 AND migrated_count < total_count THEN
    RAISE WARNING 'Migration incomplete: % of % groups migrated', migrated_count, total_count;
  ELSE
    RAISE NOTICE 'Migration successful: % groups migrated', migrated_count;
  END IF;
END $$;
