/*
  Warnings:

  - You are about to drop the column `eventType` on the `session_events` table. All the data in the column will be lost.
  - You are about to drop the `legacy_cornell_notes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,period,time_slot,institution_id]` on the table `hourly_activity_cache` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `event_type` to the `session_events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "legacy_cornell_notes" DROP CONSTRAINT "legacy_cornell_notes_reading_session_id_fkey";

-- DropForeignKey
ALTER TABLE "legacy_cornell_notes" DROP CONSTRAINT "legacy_cornell_notes_user_id_fkey";

-- DropIndex
DROP INDEX "hourly_activity_cache_user_id_period_time_slot_key";

-- DropIndex
DROP INDEX "session_events_eventType_idx";

-- AlterTable
ALTER TABLE "daily_goals" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "hourly_activity_cache" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "reading_sessions" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "session_events" DROP COLUMN "eventType",
ADD COLUMN     "event_type" "EventType" NOT NULL;

-- AlterTable
ALTER TABLE "streaks" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "topic_graphs" ADD COLUMN     "last_compared_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "topic_nodes" ADD COLUMN     "last_reinforced_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_badges" ADD COLUMN     "institution_id" TEXT;

-- AlterTable
ALTER TABLE "user_vocabularies" ADD COLUMN     "institution_id" TEXT;

-- DropTable
DROP TABLE "legacy_cornell_notes";

-- CreateIndex
CREATE INDEX "daily_goals_user_id_idx" ON "daily_goals"("user_id");

-- CreateIndex
CREATE INDEX "daily_goals_institution_id_idx" ON "daily_goals"("institution_id");

-- CreateIndex
CREATE INDEX "hourly_activity_cache_institution_id_idx" ON "hourly_activity_cache"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_activity_cache_user_id_period_time_slot_institution__key" ON "hourly_activity_cache"("user_id", "period", "time_slot", "institution_id");

-- CreateIndex
CREATE INDEX "reading_sessions_institution_id_idx" ON "reading_sessions"("institution_id");

-- CreateIndex
CREATE INDEX "session_events_event_type_idx" ON "session_events"("event_type");

-- CreateIndex
CREATE INDEX "streaks_institution_id_idx" ON "streaks"("institution_id");

-- CreateIndex
CREATE INDEX "topic_nodes_last_reinforced_at_idx" ON "topic_nodes"("last_reinforced_at");

-- CreateIndex
CREATE INDEX "user_badges_institution_id_idx" ON "user_badges"("institution_id");

-- CreateIndex
CREATE INDEX "user_vocabularies_institution_id_idx" ON "user_vocabularies"("institution_id");

-- AddForeignKey
ALTER TABLE "daily_goals" ADD CONSTRAINT "daily_goals_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabularies" ADD CONSTRAINT "user_vocabularies_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hourly_activity_cache" ADD CONSTRAINT "hourly_activity_cache_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
