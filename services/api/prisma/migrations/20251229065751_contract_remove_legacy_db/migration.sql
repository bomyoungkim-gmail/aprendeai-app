/*
  Warnings:

  - The `actor_role` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `family_id` on the `contents` table. All the data in the column will be lost.
  - The `default_role` column on the `institution_domains` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `institution_invites` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `requested_role` column on the `pending_user_approvals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `class_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_contents` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `role` on the `user_role_assignments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "class_students" DROP CONSTRAINT "class_students_class_id_fkey";

-- DropForeignKey
ALTER TABLE "class_students" DROP CONSTRAINT "class_students_student_id_fkey";

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_institution_id_fkey";

-- DropForeignKey
ALTER TABLE "contents" DROP CONSTRAINT "contents_family_id_fkey";

-- DropForeignKey
ALTER TABLE "group_contents" DROP CONSTRAINT "group_contents_content_id_fkey";

-- DropForeignKey
ALTER TABLE "group_contents" DROP CONSTRAINT "group_contents_group_id_fkey";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "actor_role",
ADD COLUMN     "actor_role" TEXT;

-- AlterTable
ALTER TABLE "contents" DROP COLUMN "family_id";

-- AlterTable
ALTER TABLE "institution_domains" DROP COLUMN "default_role",
ADD COLUMN     "default_role" TEXT NOT NULL DEFAULT 'STUDENT';

-- AlterTable
ALTER TABLE "institution_invites" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'STUDENT';

-- AlterTable
ALTER TABLE "pending_user_approvals" DROP COLUMN "requested_role",
ADD COLUMN     "requested_role" TEXT NOT NULL DEFAULT 'STUDENT';

-- AlterTable
ALTER TABLE "user_role_assignments" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";

-- DropTable
DROP TABLE "class_students";

-- DropTable
DROP TABLE "classes";

-- DropTable
DROP TABLE "group_contents";

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE INDEX "user_role_assignments_role_idx" ON "user_role_assignments"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_user_id_role_scope_type_scope_id_key" ON "user_role_assignments"("user_id", "role", "scope_type", "scope_id");
