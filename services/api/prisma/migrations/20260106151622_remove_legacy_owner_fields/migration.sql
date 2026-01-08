/*
  Warnings:

  - You are about to drop the column `owner_id` on the `contents` table. All the data in the column will be lost.
  - You are about to drop the column `owner_type` on the `contents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contents" DROP COLUMN "owner_id",
DROP COLUMN "owner_type";
