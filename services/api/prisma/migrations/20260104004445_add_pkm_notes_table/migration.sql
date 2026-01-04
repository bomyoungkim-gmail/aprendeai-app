-- CreateEnum
CREATE TYPE "PkmNoteStatus" AS ENUM ('GENERATED', 'SAVED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "pkm_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT,
    "session_id" TEXT,
    "mission_id" TEXT,
    "title" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "tags_json" JSONB NOT NULL DEFAULT '[]',
    "backlinks_json" JSONB NOT NULL DEFAULT '{}',
    "source_metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "PkmNoteStatus" NOT NULL DEFAULT 'GENERATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pkm_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pkm_notes_user_id_idx" ON "pkm_notes"("user_id");

-- CreateIndex
CREATE INDEX "pkm_notes_content_id_idx" ON "pkm_notes"("content_id");

-- CreateIndex
CREATE INDEX "pkm_notes_session_id_idx" ON "pkm_notes"("session_id");

-- CreateIndex
CREATE INDEX "pkm_notes_mission_id_idx" ON "pkm_notes"("mission_id");

-- CreateIndex
CREATE INDEX "pkm_notes_status_idx" ON "pkm_notes"("status");

-- CreateIndex
CREATE INDEX "pkm_notes_created_at_idx" ON "pkm_notes"("created_at");

-- AddForeignKey
ALTER TABLE "pkm_notes" ADD CONSTRAINT "pkm_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pkm_notes" ADD CONSTRAINT "pkm_notes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
