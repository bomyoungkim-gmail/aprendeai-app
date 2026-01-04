-- AlterTable
ALTER TABLE "reading_sessions" ADD COLUMN     "aggregated_at" TIMESTAMP(3),
ADD COLUMN     "analytics_json" JSONB;
