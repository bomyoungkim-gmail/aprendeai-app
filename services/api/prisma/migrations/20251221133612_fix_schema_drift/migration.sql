/*
  Warnings:

  - You are about to drop the column `scopeType` on the `contents` table. All the data in the column will be lost.
  - The `scope_type` column on the `study_groups` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `scope_type` on the `entitlement_overrides` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `scope_type` on the `subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `scope_type` on the `usage_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('HIGHLIGHT', 'NOTE', 'COMMENT');

-- CreateEnum
CREATE TYPE "AnnotationVisibility" AS ENUM ('PRIVATE', 'GROUP', 'PUBLIC');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('OWNER', 'GUARDIAN', 'CHILD');

-- CreateEnum
CREATE TYPE "FamilyMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'REMOVED');

-- AlterEnum
ALTER TYPE "ScopeType" ADD VALUE 'FAMILY';

-- DropForeignKey
ALTER TABLE "daily_activities" DROP CONSTRAINT "daily_activities_user_id_fkey";

-- DropForeignKey
ALTER TABLE "group_chat_messages" DROP CONSTRAINT "group_chat_messages_user_id_fkey";

-- AlterTable
ALTER TABLE "contents" DROP COLUMN "scopeType",
ADD COLUMN     "family_id" TEXT,
ADD COLUMN     "scope_type" "ScopeType" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "daily_activities" ADD COLUMN     "annotations_created" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contents_read" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minutes_studied" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sessions_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "entitlement_overrides" DROP COLUMN "scope_type",
ADD COLUMN     "scope_type" "ScopeType" NOT NULL;

-- AlterTable
ALTER TABLE "study_groups" DROP COLUMN "scope_type",
ADD COLUMN     "scope_type" "ScopeType";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "scope_type",
ADD COLUMN     "scope_type" "ScopeType" NOT NULL;

-- AlterTable
ALTER TABLE "usage_events" DROP COLUMN "scope_type",
ADD COLUMN     "scope_type" "ScopeType" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "settings" JSONB DEFAULT '{}';

-- DropEnum
DROP TYPE "SubscriptionScope";

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "start_offset" INTEGER NOT NULL,
    "end_offset" INTEGER NOT NULL,
    "selected_text" TEXT,
    "text" TEXT,
    "color" TEXT,
    "visibility" "AnnotationVisibility" NOT NULL,
    "group_id" TEXT,
    "parent_id" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "join_code" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL,
    "status" "FamilyMemberStatus" NOT NULL DEFAULT 'INVITED',
    "display_name" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annotations_content_id_idx" ON "annotations"("content_id");

-- CreateIndex
CREATE INDEX "annotations_user_id_idx" ON "annotations"("user_id");

-- CreateIndex
CREATE INDEX "annotations_group_id_idx" ON "annotations"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "families_join_code_key" ON "families"("join_code");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_family_id_user_id_key" ON "family_members"("family_id", "user_id");

-- CreateIndex
CREATE INDEX "daily_activities_user_id_date_idx" ON "daily_activities"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "entitlement_overrides_scope_type_scope_id_key" ON "entitlement_overrides"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "study_groups_scope_type_scope_id_idx" ON "study_groups"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "subscriptions_scope_type_scope_id_idx" ON "subscriptions"("scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_scope_status_unique" ON "subscriptions"("scope_type", "scope_id", "status");

-- CreateIndex
CREATE INDEX "usage_events_scope_type_scope_id_metric_occurred_at_idx" ON "usage_events"("scope_type", "scope_id", "metric", "occurred_at");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "annotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
