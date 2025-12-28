-- SUBFASE 2.4: Add content ownership fields to contents
-- Add owner_type enum column (nullable for backward compat)
ALTER TABLE "contents"
ADD COLUMN "owner_type" TEXT;

-- Add owner_id column (nullable for backward compat)
ALTER TABLE "contents"
ADD COLUMN "owner_id" TEXT;

-- Note: These columns will be populated by the backfill script
-- Backfill logic:
-- - If owner_user_id is set → owner_type=USER, owner_id=owner_user_id
-- - If family_id is set → owner_type=FAMILY, owner_id=family_id  
-- - If institution_id is set → owner_type=INSTITUTION, owner_id=institution_id