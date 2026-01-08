-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('MULTIPLE_CHOICE', 'OPEN_ENDED', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'MATCHING', 'ORDERING');

-- CreateEnum
CREATE TYPE "BloomTaxonomy" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');

-- CreateTable
CREATE TABLE "item_bank" (
    "id" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB,
    "explanation" TEXT,
    "language" "Language" NOT NULL,
    "difficulty" DOUBLE PRECISION,
    "bloom_level" "BloomTaxonomy",
    "tags" TEXT[],
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "legacy_id" TEXT,

    CONSTRAINT "item_bank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_bank_language_difficulty_idx" ON "item_bank"("language", "difficulty");

-- CreateIndex
CREATE INDEX "item_bank_type_idx" ON "item_bank"("type");
