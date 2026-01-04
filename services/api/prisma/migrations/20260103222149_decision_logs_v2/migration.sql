-- CreateEnum
CREATE TYPE "DecisionAction" AS ENUM ('NO_OP', 'ASK_PROMPT', 'ASSIGN_MISSION', 'GUIDED_SYNTHESIS', 'CALL_AGENT', 'CALL_AI_SERVICE_EXTRACT');

-- CreateEnum
CREATE TYPE "SuppressReason" AS ENUM ('POLICY_DISABLED', 'BUDGET_EXCEEDED', 'RATE_LIMITED', 'COOLDOWN_ACTIVE', 'PHASE_DURING_INVISIBLE', 'LOW_FLOW_SILENCE', 'SAFETY_GUARD', 'MISSING_INPUTS', 'DEGRADED_CAPABILITY');

-- AlterTable
ALTER TABLE "decision_logs" ADD COLUMN     "budget_remaining_tokens" INTEGER,
ADD COLUMN     "candidate_action" "DecisionAction",
ADD COLUMN     "channel_after" "DecisionChannel",
ADD COLUMN     "channel_before" "DecisionChannel",
ADD COLUMN     "cooldown_until" TIMESTAMP(3),
ADD COLUMN     "final_action" "DecisionAction",
ADD COLUMN     "policy_snapshot_json" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "suppress_reasons_json" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "suppressed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "decision_logs_created_at_idx" ON "decision_logs"("created_at");

-- CreateIndex
CREATE INDEX "decision_logs_user_id_content_id_idx" ON "decision_logs"("user_id", "content_id");

-- CreateIndex
CREATE INDEX "decision_logs_session_id_idx" ON "decision_logs"("session_id");

-- CreateIndex
CREATE INDEX "decision_logs_content_id_idx" ON "decision_logs"("content_id");
