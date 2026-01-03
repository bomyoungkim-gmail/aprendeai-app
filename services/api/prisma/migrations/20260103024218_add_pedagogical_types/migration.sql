-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnnotationType" ADD VALUE 'EVIDENCE';
ALTER TYPE "AnnotationType" ADD VALUE 'VOCABULARY';
ALTER TYPE "AnnotationType" ADD VALUE 'MAIN_IDEA';
ALTER TYPE "AnnotationType" ADD VALUE 'DOUBT';
ALTER TYPE "AnnotationType" ADD VALUE 'SYNTHESIS';
