/*
  Warnings:

  - You are about to drop the column `question_id` on the `question_analytics` table. All the data in the column will be lost.
  - You are about to drop the column `question_id` on the `question_results` table. All the data in the column will be lost.
  - You are about to drop the column `source_question_id` on the `question_translations` table. All the data in the column will be lost.
  - You are about to drop the `question_bank` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[item_id]` on the table `question_analytics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[item_id,target_language]` on the table `question_translations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `item_id` to the `question_analytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_id` to the `question_results` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_id` to the `question_translations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "question_analytics" DROP CONSTRAINT "question_analytics_question_id_fkey";

-- DropForeignKey
ALTER TABLE "question_results" DROP CONSTRAINT "question_results_question_id_fkey";

-- DropForeignKey
ALTER TABLE "question_translations" DROP CONSTRAINT "question_translations_source_question_id_fkey";

-- DropIndex
DROP INDEX "question_analytics_question_id_key";

-- DropIndex
DROP INDEX "question_results_question_id_idx";

-- DropIndex
DROP INDEX "question_translations_source_question_id_target_language_key";

-- AlterTable
ALTER TABLE "question_analytics" DROP COLUMN "question_id",
ADD COLUMN     "item_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "question_results" DROP COLUMN "question_id",
ADD COLUMN     "item_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "question_translations" DROP COLUMN "source_question_id",
ADD COLUMN     "item_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "question_bank";

-- CreateIndex
CREATE UNIQUE INDEX "question_analytics_item_id_key" ON "question_analytics"("item_id");

-- CreateIndex
CREATE INDEX "question_results_item_id_idx" ON "question_results"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_translations_item_id_target_language_key" ON "question_translations"("item_id", "target_language");

-- AddForeignKey
ALTER TABLE "question_analytics" ADD CONSTRAINT "question_analytics_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_results" ADD CONSTRAINT "question_results_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_translations" ADD CONSTRAINT "question_translations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item_bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
