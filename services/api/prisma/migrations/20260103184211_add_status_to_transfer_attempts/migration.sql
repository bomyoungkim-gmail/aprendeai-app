/*
  Warnings:

  - Added the required column `updated_at` to the `transfer_attempts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "DecisionReason" ADD VALUE 'NO_TRIGGER';

-- AlterTable
ALTER TABLE "transfer_attempts" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "transfer_attempts_status_idx" ON "transfer_attempts"("status");
