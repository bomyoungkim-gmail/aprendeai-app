-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'ANNOTATION_FAVORITE_TOGGLED';
ALTER TYPE "EventType" ADD VALUE 'ANNOTATION_REPLY_CREATED';
ALTER TYPE "EventType" ADD VALUE 'PROMPT_SENT';
ALTER TYPE "EventType" ADD VALUE 'PROMPT_RECEIVED';

-- CreateTable
CREATE TABLE "game_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_plays" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "last_played" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_progress_user_id_idx" ON "game_progress"("user_id");

-- CreateIndex
CREATE INDEX "game_progress_game_id_idx" ON "game_progress"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_progress_user_id_game_id_key" ON "game_progress"("user_id", "game_id");

-- AddForeignKey
ALTER TABLE "game_progress" ADD CONSTRAINT "game_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
