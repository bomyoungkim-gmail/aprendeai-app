-- AlterTable
ALTER TABLE "family_policies" ADD COLUMN     "llm_hard_rate_limit_per_min" INTEGER NOT NULL DEFAULT 10;
