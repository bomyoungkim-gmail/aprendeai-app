-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "universal_concept_id" TEXT,
    "has_translations" BOOLEAN NOT NULL DEFAULT false,
    "game_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "education_level" TEXT NOT NULL,
    "question" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "metadata" JSONB,
    "source_type" TEXT NOT NULL,
    "source_content_id" TEXT,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "avg_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_translations" (
    "id" TEXT NOT NULL,
    "source_question_id" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "question" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "is_ai_translated" BOOLEAN NOT NULL DEFAULT true,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "game_session_id" TEXT,
    "score" INTEGER NOT NULL,
    "time_taken" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "self_rating" INTEGER,
    "user_answer" JSONB,
    "mistakes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_analytics" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION NOT NULL,
    "avg_score" DOUBLE PRECISION NOT NULL,
    "avg_time" INTEGER NOT NULL,
    "avg_self_rating" DOUBLE PRECISION,
    "common_mistakes" JSONB NOT NULL,
    "is_difficult" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_difficulty" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "avg_score" DOUBLE PRECISION NOT NULL,
    "success_rate" DOUBLE PRECISION NOT NULL,
    "common_mistakes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_difficulty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_bank_language_game_type_subject_topic_idx" ON "question_bank"("language", "game_type", "subject", "topic");

-- CreateIndex
CREATE INDEX "question_bank_universal_concept_id_idx" ON "question_bank"("universal_concept_id");

-- CreateIndex
CREATE INDEX "question_bank_education_level_difficulty_idx" ON "question_bank"("education_level", "difficulty");

-- CreateIndex
CREATE INDEX "question_translations_target_language_idx" ON "question_translations"("target_language");

-- CreateIndex
CREATE UNIQUE INDEX "question_translations_source_question_id_target_language_key" ON "question_translations"("source_question_id", "target_language");

-- CreateIndex
CREATE INDEX "question_results_user_id_created_at_idx" ON "question_results"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "question_results_question_id_idx" ON "question_results"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_analytics_question_id_key" ON "question_analytics"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "concept_difficulty_topic_subject_key" ON "concept_difficulty"("topic", "subject");

-- AddForeignKey
ALTER TABLE "question_translations" ADD CONSTRAINT "question_translations_source_question_id_fkey" FOREIGN KEY ("source_question_id") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_analytics" ADD CONSTRAINT "question_analytics_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
