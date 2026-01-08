-- DropForeignKey
ALTER TABLE "annotations" DROP CONSTRAINT "annotations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "decision_logs" DROP CONSTRAINT "decision_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "entitlement_snapshots" DROP CONSTRAINT "entitlement_snapshots_user_id_fkey";

-- DropIndex
DROP INDEX "institution_members_user_id_key";

-- AlterTable
ALTER TABLE "annotations" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "decision_logs" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "entitlement_snapshots" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_snapshots" ADD CONSTRAINT "entitlement_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
