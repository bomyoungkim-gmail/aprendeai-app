/*
  Warnings:

  - The values [EDUCATOR,LEARNER] on the enum `FamilyRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `active_institution_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,scope_type,scope_id]` on the table `entitlement_snapshots` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `institution_members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scope_type` to the `entitlement_snapshots` table without a default value. This is not possible if the table is not empty.
  - Made the column `scope_id` on table `entitlement_snapshots` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `role` on the `institution_members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EntitlementScopeType" AS ENUM ('USER', 'FAMILY', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "FamilyLearningRole" AS ENUM ('EDUCATOR', 'LEARNER', 'PEER');

-- AlterEnum
BEGIN;
CREATE TYPE "FamilyRole_new" AS ENUM ('OWNER', 'GUARDIAN', 'CHILD');
ALTER TABLE "family_members" ALTER COLUMN "role" TYPE "FamilyRole_new" USING ("role"::text::"FamilyRole_new");
ALTER TYPE "FamilyRole" RENAME TO "FamilyRole_old";
ALTER TYPE "FamilyRole_new" RENAME TO "FamilyRole";
DROP TYPE "FamilyRole_old";
COMMIT;

-- DropIndex
DROP INDEX "entitlement_snapshots_user_id_key";

-- DropIndex
DROP INDEX "institution_members_institution_id_user_id_key";

-- AlterTable
ALTER TABLE "entitlement_snapshots" DROP COLUMN "scope_type",
ADD COLUMN     "scope_type" "EntitlementScopeType" NOT NULL,
ALTER COLUMN "scope_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "family_members" ADD COLUMN     "learning_role" "FamilyLearningRole";

-- AlterTable
ALTER TABLE "institution_members" DROP COLUMN "role",
ADD COLUMN     "role" "InstitutionRole" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "active_institution_id",
ALTER COLUMN "role" SET DEFAULT 'COMMON_USER';

-- CreateIndex
CREATE INDEX "entitlement_snapshots_user_id_scope_type_idx" ON "entitlement_snapshots"("user_id", "scope_type");

-- CreateIndex
CREATE UNIQUE INDEX "entitlement_snapshots_user_id_scope_type_scope_id_key" ON "entitlement_snapshots"("user_id", "scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "institution_members_user_id_key" ON "institution_members"("user_id");
