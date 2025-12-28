-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'SUPPORT', 'OPS');

-- CreateEnum
CREATE TYPE "ContextRole" AS ENUM ('OWNER', 'INSTITUTION_EDUCATION_ADMIN', 'TEACHER', 'STUDENT', 'INSTITUTION_ENTERPRISE_ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "InstitutionKind" AS ENUM ('EDUCATION', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "InstitutionRole" AS ENUM ('INSTITUTION_EDUCATION_ADMIN', 'TEACHER', 'STUDENT', 'INSTITUTION_ENTERPRISE_ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "ContentOwnerType" AS ENUM ('USER', 'INSTITUTION', 'CLASSROOM');

-- CreateEnum
CREATE TYPE "TeacherVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ShareContextType" AS ENUM ('CLASSROOM', 'FAMILY', 'STUDY_GROUP');

-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('VIEW', 'COMMENT', 'ASSIGN');

-- CreateEnum
CREATE TYPE "AnnotationShareMode" AS ENUM ('VIEW', 'COMMENT');

-- CreateEnum
CREATE TYPE "CommentTargetType" AS ENUM ('CONTENT', 'ANNOTATION', 'SUBMISSION');

-- AlterTable
ALTER TABLE "institutions" ADD COLUMN     "kind" "InstitutionKind" NOT NULL DEFAULT 'EDUCATION';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active_institution_id" TEXT,
ADD COLUMN     "context_role" "ContextRole" NOT NULL DEFAULT 'OWNER',
ADD COLUMN     "system_role" "SystemRole";

-- CreateTable
CREATE TABLE "teacher_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "status" "TeacherVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_shares" (
    "content_id" TEXT NOT NULL,
    "context_type" "ShareContextType" NOT NULL,
    "context_id" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL DEFAULT 'VIEW',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_shares_pkey" PRIMARY KEY ("content_id","context_type","context_id")
);

-- CreateTable
CREATE TABLE "annotation_shares" (
    "annotation_id" TEXT NOT NULL,
    "context_type" "ShareContextType" NOT NULL,
    "context_id" TEXT NOT NULL,
    "mode" "AnnotationShareMode" NOT NULL DEFAULT 'VIEW',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotation_shares_pkey" PRIMARY KEY ("annotation_id","context_type","context_id")
);

-- CreateTable
CREATE TABLE "comment_threads" (
    "id" TEXT NOT NULL,
    "context_type" "ShareContextType" NOT NULL,
    "context_id" TEXT NOT NULL,
    "target_type" "CommentTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "delete_reason" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_policies" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "allow_advanced_ai" BOOLEAN NOT NULL DEFAULT false,
    "allow_external_sharing" BOOLEAN NOT NULL DEFAULT false,
    "allow_text_extraction" BOOLEAN NOT NULL DEFAULT false,
    "student_unenrollment_mode" TEXT NOT NULL DEFAULT 'TEACHER_OR_ADMIN_ONLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gradebook_exports" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "range" JSONB NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'CSV',
    "file_ref" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gradebook_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_verifications_user_id_key" ON "teacher_verifications"("user_id");

-- CreateIndex
CREATE INDEX "teacher_verifications_institution_id_status_idx" ON "teacher_verifications"("institution_id", "status");

-- CreateIndex
CREATE INDEX "content_shares_context_type_context_id_idx" ON "content_shares"("context_type", "context_id");

-- CreateIndex
CREATE INDEX "annotation_shares_context_type_context_id_idx" ON "annotation_shares"("context_type", "context_id");

-- CreateIndex
CREATE INDEX "comment_threads_context_type_context_id_idx" ON "comment_threads"("context_type", "context_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_threads_context_type_context_id_target_type_target__key" ON "comment_threads"("context_type", "context_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "comments_thread_id_created_at_idx" ON "comments"("thread_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "institution_policies_institution_id_key" ON "institution_policies"("institution_id");

-- CreateIndex
CREATE INDEX "gradebook_exports_classroom_id_created_at_idx" ON "gradebook_exports"("classroom_id", "created_at");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "comment_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
