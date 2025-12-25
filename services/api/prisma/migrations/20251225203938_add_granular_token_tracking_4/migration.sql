/*
  Warnings:

  - You are about to drop the column `cost` on the `provider_usage` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "provider_usage_provider_timestamp_idx";

-- DropIndex
DROP INDEX "provider_usage_user_id_idx";

-- AlterTable
ALTER TABLE "provider_usage" DROP COLUMN "cost",
ADD COLUMN     "completion_tokens" INTEGER,
ADD COLUMN     "cost_usd" DOUBLE PRECISION,
ADD COLUMN     "family_id" TEXT,
ADD COLUMN     "feature" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "group_id" TEXT,
ADD COLUMN     "institution_id" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "prompt_tokens" INTEGER,
ADD COLUMN     "total_tokens" INTEGER;

-- CreateIndex
CREATE INDEX "provider_usage_timestamp_idx" ON "provider_usage"("timestamp");

-- CreateIndex
CREATE INDEX "provider_usage_user_id_timestamp_idx" ON "provider_usage"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "provider_usage_family_id_timestamp_idx" ON "provider_usage"("family_id", "timestamp");

-- CreateIndex
CREATE INDEX "provider_usage_institution_id_timestamp_idx" ON "provider_usage"("institution_id", "timestamp");

-- AddForeignKey
ALTER TABLE "provider_usage" ADD CONSTRAINT "provider_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_usage" ADD CONSTRAINT "provider_usage_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_usage" ADD CONSTRAINT "provider_usage_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_usage" ADD CONSTRAINT "provider_usage_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
