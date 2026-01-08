-- CreateEnum
CREATE TYPE "ItemVisibility" AS ENUM ('PRIVATE', 'INSTITUTION', 'PUBLIC');

-- AlterTable
ALTER TABLE "item_bank"
ADD COLUMN "scope_id" TEXT,
ADD COLUMN "scope_type" "ScopeType" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN "visibility" "ItemVisibility" NOT NULL DEFAULT 'PRIVATE';

-- Populate scope_id and scope_type based on created_by user's context
-- Step 1: For items created by users in institutions
UPDATE "item_bank" AS ib
SET
  scope_type = 'INSTITUTION',
  scope_id = im.institution_id,
  visibility = 'INSTITUTION' -- Default to institution-wide visibility
FROM
  institution_members im
WHERE
  ib.created_by = im.user_id
  AND ib.created_by IS NOT NULL;

-- Step 2: For items created by users in families (if not already set)
UPDATE "item_bank" AS ib
SET
  scope_type = 'FAMILY',
  scope_id = fm.family_id,
  visibility = 'PRIVATE' -- Family items default to private
FROM
  family_members fm
WHERE
  ib.created_by = fm.user_id
  AND ib.scope_type = 'GLOBAL' -- Only update if not already set
  AND ib.created_by IS NOT NULL;

-- Step 3: For items created by standalone users (no institution/family)
UPDATE "item_bank"
SET
  scope_type = 'USER',
  scope_id = created_by,
  visibility = 'PRIVATE'
WHERE
  created_by IS NOT NULL
  AND scope_type = 'GLOBAL';

-- Only update remaining GLOBAL items
-- Step 4: For legacy items without created_by, keep as GLOBAL/PUBLIC
UPDATE "item_bank"
SET
  visibility = 'PUBLIC'
WHERE
  created_by IS NULL
  AND scope_type = 'GLOBAL';

-- CreateIndex
CREATE INDEX "item_bank_scope_type_scope_id_language_idx" ON "item_bank" ("scope_type", "scope_id", "language");

-- CreateIndex
CREATE INDEX "item_bank_visibility_language_idx" ON "item_bank" ("visibility", "language");

-- CreateIndex
CREATE INDEX "item_bank_created_by_idx" ON "item_bank" ("created_by");