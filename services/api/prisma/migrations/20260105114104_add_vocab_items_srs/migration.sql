-- AlterTable
ALTER TABLE "hourly_activity_cache" ALTER COLUMN "period" SET DATA TYPE TEXT,
ALTER COLUMN "time_slot" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "vocab_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "context" TEXT,
    "srs_stage" "SrsStage" NOT NULL DEFAULT 'NEW',
    "due_at" TIMESTAMP(3) NOT NULL,
    "last_reviewed_at" TIMESTAMP(3),
    "mastery_score" INTEGER NOT NULL DEFAULT 0,
    "lapse_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocab_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocab_items_user_id_due_at_idx" ON "vocab_items"("user_id", "due_at");

-- CreateIndex
CREATE INDEX "vocab_items_word_idx" ON "vocab_items"("word");

-- CreateIndex
CREATE UNIQUE INDEX "vocab_items_user_id_word_key" ON "vocab_items"("user_id", "word");

-- AddForeignKey
ALTER TABLE "vocab_items" ADD CONSTRAINT "vocab_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_items" ADD CONSTRAINT "vocab_items_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "hourly_activity_cache_user_period_idx" RENAME TO "hourly_activity_cache_user_id_period_idx";

-- RenameIndex
ALTER INDEX "hourly_activity_cache_user_period_slot_key" RENAME TO "hourly_activity_cache_user_id_period_time_slot_key";
