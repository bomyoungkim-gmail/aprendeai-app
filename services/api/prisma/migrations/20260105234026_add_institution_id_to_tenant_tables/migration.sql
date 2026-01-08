/*
  Warnings:

  - A unique constraint covering the columns `[user_id,date,institution_id]` on the table `daily_activities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,game_id,institution_id]` on the table `game_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "daily_activities_user_id_date_key";

-- DropIndex
DROP INDEX "game_progress_user_id_game_id_key";

-- AlterTable
ALTER TABLE "assessment_attempts" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "daily_activities" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "game_progress" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "game_results" ADD COLUMN     "institution_id" TEXT;

-- CreateIndex
CREATE INDEX "assessment_attempts_institution_id_idx" ON "assessment_attempts"("institution_id");

-- CreateIndex
CREATE INDEX "daily_activities_institution_id_idx" ON "daily_activities"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activities_user_id_date_institution_id_key" ON "daily_activities"("user_id", "date", "institution_id");

-- CreateIndex
CREATE INDEX "game_progress_institution_id_idx" ON "game_progress"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_progress_user_id_game_id_institution_id_key" ON "game_progress"("user_id", "game_id", "institution_id");

-- CreateIndex
CREATE INDEX "game_results_institution_id_idx" ON "game_results"("institution_id");

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_progress" ADD CONSTRAINT "game_progress_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
