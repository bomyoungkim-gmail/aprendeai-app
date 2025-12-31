-- Drop old FK
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_institution_id_fkey";

-- Rename Columns
ALTER TABLE "users" RENAME COLUMN "institution_id" TO "last_institution_id";
ALTER TABLE "users" RENAME COLUMN "context_role" TO "last_context_role";

-- Add FK on new column name
-- Note: Assuming "institutions"("id") exists.
ALTER TABLE "users" ADD CONSTRAINT "users_last_institution_id_fkey" FOREIGN KEY ("last_institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensure constraints match new schema if needed (optional, assumes types match)
-- ALTER TABLE "users" ALTER COLUMN "last_context_role" SET DEFAULT 'OWNER';
