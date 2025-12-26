-- CreateTable
CREATE TABLE "content_pedagogical_data" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "vocabulary_triage" JSONB,
    "socratic_questions" JSONB,
    "quiz_questions" JSONB,
    "taboo_cards" JSONB,
    "boss_fight_config" JSONB,
    "free_recall_prompts" JSONB,
    "processing_version" TEXT NOT NULL DEFAULT 'v1.0',
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pedagogical_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_pedagogical_data_content_id_key" ON "content_pedagogical_data"("content_id");

-- CreateIndex
CREATE INDEX "content_pedagogical_data_content_id_idx" ON "content_pedagogical_data"("content_id");

-- CreateIndex
CREATE INDEX "game_results_user_id_content_id_idx" ON "game_results"("user_id", "content_id");

-- CreateIndex
CREATE INDEX "game_results_gameType_idx" ON "game_results"("gameType");

-- CreateIndex
CREATE INDEX "game_results_played_at_idx" ON "game_results"("played_at");

-- AddForeignKey
ALTER TABLE "content_pedagogical_data" ADD CONSTRAINT "content_pedagogical_data_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
