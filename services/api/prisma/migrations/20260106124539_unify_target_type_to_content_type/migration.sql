/*
  Warnings:

  - Changed the type of `target_type` on the `highlights` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "highlights" ALTER COLUMN "target_type" TYPE "ContentType" USING "target_type"::text::"ContentType";

-- DropEnum
DROP TYPE "TargetType";
