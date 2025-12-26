-- CreateEnum: Add new visibility scopes for granular sharing
CREATE TYPE "VisibilityScope" AS ENUM ('CLASS_PROJECT', 'ONLY_EDUCATORS', 'RESPONSIBLES_OF_LEARNER', 'GROUP_MEMBERS');

-- CreateEnum: Add context type enum
CREATE TYPE "ContextType" AS ENUM ('INSTITUTION', 'GROUP_STUDY', 'FAMILY');

-- CreateEnum: Add annotation status for soft delete
CREATE TYPE "AnnotationStatus" AS ENUM ('ACTIVE', 'DELETED');

-- AlterEnum: Extend TargetType to include VIDEO and AUDIO
ALTER TYPE "TargetType" ADD VALUE 'VIDEO';
ALTER TYPE "TargetType" ADD VALUE 'AUDIO';

-- AlterTable: Extend Highlight with new fields for Cornell Notes granular sharing
ALTER TABLE "highlights" ADD COLUMN "timestamp_ms" INTEGER;
ALTER TABLE "highlights" ADD COLUMN "duration_ms" INTEGER;
ALTER TABLE "highlights" ADD COLUMN "visibility" "AnnotationVisibility" NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE "highlights" ADD COLUMN "visibility_scope" "VisibilityScope";
ALTER TABLE "highlights" ADD COLUMN "context_type" "ContextType";
ALTER TABLE "highlights" ADD COLUMN "context_id" TEXT;
ALTER TABLE "highlights" ADD COLUMN "learner_id" TEXT;
ALTER TABLE "highlights" ADD COLUMN "status" "AnnotationStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "highlights" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateTable: AnnotationComment for thread system
CREATE TABLE "annotation_comments" (
    "id" TEXT NOT NULL,
    "highlight_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "AnnotationStatus" NOT NULL DEFAULT 'ACTIVE',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotation_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indexes for AnnotationComment
CREATE INDEX "annotation_comments_highlight_id_idx" ON "annotation_comments"("highlight_id");
CREATE INDEX "annotation_comments_user_id_idx" ON "annotation_comments"("user_id");
CREATE INDEX "annotation_comments_status_idx" ON "annotation_comments"("status");

-- CreateIndex: Indexes for Highlight new fields
CREATE INDEX "highlights_visibility_idx" ON "highlights"("visibility");
CREATE INDEX "highlights_context_type_idx" ON "highlights"("context_type");
CREATE INDEX "highlights_context_id_idx" ON "highlights"("context_id");
CREATE INDEX "highlights_status_idx" ON "highlights"("status");

-- AddForeignKey: AnnotationComment relations
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "highlights"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
