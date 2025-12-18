/*
  Warnings:

  - Added the required column `updated_at` to the `user_vocabularies` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SrsStage" AS ENUM ('NEW', 'D1', 'D3', 'D7', 'D14', 'D30', 'D60', 'MASTERED');

-- CreateEnum
CREATE TYPE "VocabDimension" AS ENUM ('FORM', 'MEANING', 'USE');

-- CreateEnum
CREATE TYPE "AttemptResult" AS ENUM ('FAIL', 'HARD', 'OK', 'EASY');

-- AlterTable
ALTER TABLE "learner_profiles" ADD COLUMN     "daily_review_cap" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "user_vocabularies" ADD COLUMN     "content_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "due_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "example_note" TEXT,
ADD COLUMN     "lapses_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mastery_form" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mastery_meaning" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mastery_use" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "meaning_note" TEXT,
ADD COLUMN     "srs_stage" "SrsStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "vocab_attempts" (
    "id" TEXT NOT NULL,
    "vocab_id" TEXT NOT NULL,
    "session_id" TEXT,
    "dimension" "VocabDimension" NOT NULL,
    "result" "AttemptResult" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocab_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocab_attempts_vocab_id_idx" ON "vocab_attempts"("vocab_id");

-- CreateIndex
CREATE INDEX "vocab_attempts_created_at_idx" ON "vocab_attempts"("created_at");

-- CreateIndex
CREATE INDEX "user_vocabularies_user_id_due_at_idx" ON "user_vocabularies"("user_id", "due_at");

-- CreateIndex
CREATE INDEX "user_vocabularies_srs_stage_idx" ON "user_vocabularies"("srs_stage");

-- AddForeignKey
ALTER TABLE "user_vocabularies" ADD CONSTRAINT "user_vocabularies_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_attempts" ADD CONSTRAINT "vocab_attempts_vocab_id_fkey" FOREIGN KEY ("vocab_id") REFERENCES "user_vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_attempts" ADD CONSTRAINT "vocab_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "reading_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
