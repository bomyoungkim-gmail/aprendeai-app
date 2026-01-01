/*
  Warnings:

  - You are about to drop the column `contentId` on the `cornell_notes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `cornell_notes` table. All the data in the column will be lost.
  - You are about to drop the column `cuesJson` on the `cornell_notes` table. All the data in the column will be lost.
  - You are about to drop the column `notesJson` on the `cornell_notes` table. All the data in the column will be lost.
  - You are about to drop the column `summaryText` on the `cornell_notes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `cornell_notes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `cornell_notes` table. All the data in the column will be lost.
  - You are about to drop the column `gameType` on the `game_results` table. All the data in the column will be lost.
  - You are about to drop the column `anchorJson` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `colorKey` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `commentText` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `contentId` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `pageNumber` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `tagsJson` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `targetType` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `highlights` table. All the data in the column will be lost.
  - You are about to drop the column `maxMembers` on the `institutions` table. All the data in the column will be lost.
  - You are about to drop the column `context_role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `institution_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `user_role_assignments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[content_id,user_id]` on the table `cornell_notes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[password_reset_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content_id` to the `cornell_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `cornell_notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `game_type` to the `game_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `anchor_json` to the `highlights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content_id` to the `highlights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_type` to the `highlights` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `highlights` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentMode" AS ENUM ('NARRATIVE', 'DIDACTIC', 'TECHNICAL', 'NEWS', 'SCIENTIFIC', 'LANGUAGE');

-- DropForeignKey
ALTER TABLE "cornell_notes" DROP CONSTRAINT "cornell_notes_contentId_fkey";

-- DropForeignKey
ALTER TABLE "cornell_notes" DROP CONSTRAINT "cornell_notes_userId_fkey";

-- DropForeignKey
ALTER TABLE "family_members" DROP CONSTRAINT "family_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "highlights" DROP CONSTRAINT "highlights_contentId_fkey";

-- DropForeignKey
ALTER TABLE "highlights" DROP CONSTRAINT "highlights_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_role_assignments" DROP CONSTRAINT "user_role_assignments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_institution_id_fkey";

-- DropIndex
DROP INDEX "cornell_notes_contentId_idx";

-- DropIndex
DROP INDEX "cornell_notes_contentId_userId_key";

-- DropIndex
DROP INDEX "cornell_notes_userId_idx";

-- DropIndex
DROP INDEX "game_results_gameType_idx";

-- DropIndex
DROP INDEX "highlights_contentId_idx";

-- DropIndex
DROP INDEX "highlights_userId_idx";

-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "mode" "ContentMode",
ADD COLUMN     "mode_set_at" TIMESTAMP(3),
ADD COLUMN     "mode_set_by" TEXT,
ADD COLUMN     "mode_source" TEXT;

-- AlterTable
ALTER TABLE "cornell_notes" DROP COLUMN "contentId",
DROP COLUMN "createdAt",
DROP COLUMN "cuesJson",
DROP COLUMN "notesJson",
DROP COLUMN "summaryText",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "content_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cues_json" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "notes_json" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "summary_text" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "families" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "game_results" DROP COLUMN "gameType",
ADD COLUMN     "game_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "highlights" DROP COLUMN "anchorJson",
DROP COLUMN "colorKey",
DROP COLUMN "commentText",
DROP COLUMN "contentId",
DROP COLUMN "createdAt",
DROP COLUMN "pageNumber",
DROP COLUMN "tagsJson",
DROP COLUMN "targetType",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "anchor_json" JSONB NOT NULL,
ADD COLUMN     "color_key" TEXT NOT NULL DEFAULT 'yellow',
ADD COLUMN     "comment_text" TEXT,
ADD COLUMN     "content_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "page_number" INTEGER,
ADD COLUMN     "tags_json" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "target_type" "TargetType" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "institutions" DROP COLUMN "maxMembers",
ADD COLUMN     "max_members" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "context_role",
DROP COLUMN "institution_id",
ADD COLUMN     "last_context_role" "ContextRole" NOT NULL DEFAULT 'OWNER',
ADD COLUMN     "last_institution_id" TEXT,
ALTER COLUMN "schooling_level" DROP NOT NULL;

-- DropTable
DROP TABLE "user_role_assignments";

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "provider_invoice_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "last4" TEXT NOT NULL,
    "exp_month" INTEGER NOT NULL,
    "exp_year" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "encrypted_details" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_version" TEXT NOT NULL DEFAULT '1.0.0',
    "ui_policy_version" TEXT,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "content_id" TEXT,
    "mode" "ContentMode",
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_provider_invoice_id_key" ON "invoices"("provider_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_subscription_id_idx" ON "invoices"("subscription_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods"("user_id");

-- CreateIndex
CREATE INDEX "telemetry_events_user_id_created_at_idx" ON "telemetry_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "telemetry_events_session_id_idx" ON "telemetry_events"("session_id");

-- CreateIndex
CREATE INDEX "telemetry_events_event_type_created_at_idx" ON "telemetry_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "telemetry_events_content_id_created_at_idx" ON "telemetry_events"("content_id", "created_at");

-- CreateIndex
CREATE INDEX "telemetry_events_user_id_event_type_created_at_idx" ON "telemetry_events"("user_id", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "telemetry_events_session_id_event_type_idx" ON "telemetry_events"("session_id", "event_type");

-- CreateIndex
CREATE INDEX "contents_mode_idx" ON "contents"("mode");

-- CreateIndex
CREATE INDEX "cornell_notes_content_id_idx" ON "cornell_notes"("content_id");

-- CreateIndex
CREATE INDEX "cornell_notes_user_id_idx" ON "cornell_notes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cornell_notes_content_id_user_id_key" ON "cornell_notes"("content_id", "user_id");

-- CreateIndex
CREATE INDEX "family_members_family_id_role_idx" ON "family_members"("family_id", "role");

-- CreateIndex
CREATE INDEX "game_results_game_type_idx" ON "game_results"("game_type");

-- CreateIndex
CREATE INDEX "highlights_content_id_idx" ON "highlights"("content_id");

-- CreateIndex
CREATE INDEX "highlights_user_id_idx" ON "highlights"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cornell_notes" ADD CONSTRAINT "cornell_notes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cornell_notes" ADD CONSTRAINT "cornell_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_verifications" ADD CONSTRAINT "teacher_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_events" ADD CONSTRAINT "telemetry_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_events" ADD CONSTRAINT "telemetry_events_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_last_institution_id_fkey" FOREIGN KEY ("last_institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
