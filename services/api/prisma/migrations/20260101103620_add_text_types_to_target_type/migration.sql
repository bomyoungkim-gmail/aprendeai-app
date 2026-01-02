-- AlterEnum
ALTER TYPE "ContentType" ADD VALUE 'TEXT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TargetType" ADD VALUE 'ARTICLE';
ALTER TYPE "TargetType" ADD VALUE 'TEXT';
ALTER TYPE "TargetType" ADD VALUE 'NEWS';
ALTER TYPE "TargetType" ADD VALUE 'ARXIV';
ALTER TYPE "TargetType" ADD VALUE 'SCHOOL_MATERIAL';
ALTER TYPE "TargetType" ADD VALUE 'WEB_CLIP';

-- CreateTable
CREATE TABLE "reading_progress" (
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "last_page" INTEGER NOT NULL DEFAULT 0,
    "last_scroll_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "device_info" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("user_id","content_id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "scroll_pct" DOUBLE PRECISION,
    "label" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glossary_cache" (
    "term" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "glossary_cache_pkey" PRIMARY KEY ("term")
);

-- CreateIndex
CREATE INDEX "bookmarks_user_id_content_id_idx" ON "bookmarks"("user_id", "content_id");

-- CreateIndex
CREATE INDEX "glossary_cache_term_idx" ON "glossary_cache"("term");

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
