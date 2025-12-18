-- CreateEnum
CREATE TYPE "SessionPhase" AS ENUM ('PRE', 'DURING', 'POST', 'FINISHED');

-- CreateEnum
CREATE TYPE "SessionModality" AS ENUM ('READING', 'LISTENING', 'WRITING');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MARK_UNKNOWN_WORD', 'MARK_KEY_IDEA', 'CHECKPOINT_RESPONSE', 'QUIZ_RESPONSE', 'PRODUCTION_SUBMIT');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('FUNDAMENTAL_1', 'FUNDAMENTAL_2', 'MEDIO', 'SUPERIOR', 'ADULTO_LEIGO');

-- AlterTable
ALTER TABLE "reading_sessions" ADD COLUMN     "asset_layer" TEXT DEFAULT 'L1',
ADD COLUMN     "goal_statement" TEXT,
ADD COLUMN     "modality" "SessionModality" DEFAULT 'READING',
ADD COLUMN     "phase" "SessionPhase" DEFAULT 'PRE',
ADD COLUMN     "prediction_text" TEXT,
ADD COLUMN     "target_words_json" JSONB;

-- CreateTable
CREATE TABLE "learner_profiles" (
    "user_id" TEXT NOT NULL,
    "education_level" "EducationLevel" NOT NULL DEFAULT 'ADULTO_LEIGO',
    "reading_level_score" INTEGER,
    "listening_level_score" INTEGER,
    "writing_level_score" INTEGER,
    "daily_time_budget_min" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "session_events" (
    "id" TEXT NOT NULL,
    "reading_session_id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_outcomes" (
    "reading_session_id" TEXT NOT NULL,
    "comprehension_score" INTEGER NOT NULL DEFAULT 0,
    "production_score" INTEGER NOT NULL DEFAULT 0,
    "frustration_index" INTEGER NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_outcomes_pkey" PRIMARY KEY ("reading_session_id")
);

-- CreateIndex
CREATE INDEX "session_events_reading_session_id_idx" ON "session_events"("reading_session_id");

-- CreateIndex
CREATE INDEX "session_events_eventType_idx" ON "session_events"("eventType");

-- AddForeignKey
ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_reading_session_id_fkey" FOREIGN KEY ("reading_session_id") REFERENCES "reading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_outcomes" ADD CONSTRAINT "session_outcomes_reading_session_id_fkey" FOREIGN KEY ("reading_session_id") REFERENCES "reading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
