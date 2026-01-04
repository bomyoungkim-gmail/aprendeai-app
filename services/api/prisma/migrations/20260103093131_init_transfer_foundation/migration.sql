-- CreateEnum
CREATE TYPE "TransferMissionType" AS ENUM ('HUGGING', 'BRIDGING', 'PRODUCTIVE_FAILURE', 'ICEBERG', 'CONNECTION_CIRCLE', 'ANALOGY', 'TIER2', 'MORPHOLOGY', 'METACOGNITION', 'PKM');

-- CreateEnum
CREATE TYPE "DecisionChannel" AS ENUM ('DETERMINISTIC', 'CACHED_LLM', 'LLM', 'TOOL_RAG', 'HUMAN_IN_LOOP');

-- CreateEnum
CREATE TYPE "DecisionReason" AS ENUM ('USER_EXPLICIT_ASK', 'DOUBT_SPIKE', 'VOCAB_MARKED', 'CHECKPOINT_FAIL', 'POST_SUMMARY', 'LOW_FLOW', 'HIGH_SWITCH_COST', 'SRS_DUE', 'TEACHER_TRIGGER', 'PARENT_TRIGGER');

-- AlterTable
ALTER TABLE "family_policies" ADD COLUMN     "decision_policy_json" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "fading_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "llm_budget_daily_tokens" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "scaffolding_level_default" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "institution_policies" ADD COLUMN     "decision_policy_json" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "fading_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "llm_budget_daily_tokens" INTEGER NOT NULL DEFAULT 15000,
ADD COLUMN     "llm_hard_rate_limit_per_min" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "scaffolding_level_default" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "transfer_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "learner_profiles" ADD COLUMN     "mastery_state_json" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "scaffolding_state_json" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "section_transfer_metadata" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "chunk_id" TEXT,
    "chunk_index" INTEGER,
    "page_number" INTEGER,
    "anchor_json" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "concept_json" JSONB NOT NULL DEFAULT '{}',
    "tier2_json" JSONB NOT NULL DEFAULT '[]',
    "analogies_json" JSONB NOT NULL DEFAULT '[]',
    "domains_json" JSONB NOT NULL DEFAULT '[]',
    "tools_json" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "scope_type" "ScopeType" NOT NULL DEFAULT 'USER',
    "family_id" TEXT,
    "institution_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_transfer_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_missions" (
    "id" TEXT NOT NULL,
    "type" "TransferMissionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prompt_template" TEXT NOT NULL,
    "rubric_json" JSONB NOT NULL DEFAULT '{}',
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "tags_json" JSONB NOT NULL DEFAULT '[]',
    "scope_type" "ScopeType" NOT NULL DEFAULT 'GLOBAL',
    "family_id" TEXT,
    "institution_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transfer_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_attempts" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT,
    "chunk_id" TEXT,
    "response_text" TEXT,
    "score" INTEGER,
    "feedback_json" JSONB NOT NULL DEFAULT '{}',
    "channel" "DecisionChannel" NOT NULL DEFAULT 'DETERMINISTIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "content_id" TEXT,
    "chunk_id" TEXT,
    "reason" "DecisionReason" NOT NULL,
    "channel" "DecisionChannel" NOT NULL,
    "ui_policy_version" TEXT,
    "input_facts_json" JSONB NOT NULL DEFAULT '{}',
    "output_action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "section_transfer_metadata_content_id_idx" ON "section_transfer_metadata"("content_id");

-- CreateIndex
CREATE INDEX "section_transfer_metadata_chunk_id_idx" ON "section_transfer_metadata"("chunk_id");

-- CreateIndex
CREATE INDEX "section_transfer_metadata_scope_type_family_id_institution__idx" ON "section_transfer_metadata"("scope_type", "family_id", "institution_id");

-- CreateIndex
CREATE INDEX "transfer_missions_type_idx" ON "transfer_missions"("type");

-- CreateIndex
CREATE INDEX "transfer_missions_scope_type_family_id_institution_id_idx" ON "transfer_missions"("scope_type", "family_id", "institution_id");

-- CreateIndex
CREATE INDEX "transfer_attempts_user_id_created_at_idx" ON "transfer_attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "transfer_attempts_mission_id_created_at_idx" ON "transfer_attempts"("mission_id", "created_at");

-- CreateIndex
CREATE INDEX "decision_logs_user_id_created_at_idx" ON "decision_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "decision_logs_session_id_created_at_idx" ON "decision_logs"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "decision_logs_reason_created_at_idx" ON "decision_logs"("reason", "created_at");

-- AddForeignKey
ALTER TABLE "section_transfer_metadata" ADD CONSTRAINT "section_transfer_metadata_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_transfer_metadata" ADD CONSTRAINT "section_transfer_metadata_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "content_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_attempts" ADD CONSTRAINT "transfer_attempts_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "transfer_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_attempts" ADD CONSTRAINT "transfer_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_attempts" ADD CONSTRAINT "transfer_attempts_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_attempts" ADD CONSTRAINT "transfer_attempts_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "content_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_logs" ADD CONSTRAINT "decision_logs_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "content_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
