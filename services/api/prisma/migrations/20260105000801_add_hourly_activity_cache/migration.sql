-- CreateEnum
CREATE TYPE "DeterministicSourceScope" AS ENUM (
    'GLOBAL',
    'INSTITUTION',
    'STUDY_GROUP',
    'FAMILY',
    'USER'
);

-- CreateEnum
CREATE TYPE "DeterministicSourceStatus" AS ENUM ('CANDIDATE', 'ACTIVE', 'DEPRECATED');

-- CreateTable
CREATE TABLE "graph_diffs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "baseline_graph_id" TEXT NOT NULL,
    "learner_graph_id" TEXT NOT NULL,
    "diff_json" JSONB NOT NULL DEFAULT '{}',
    "summary_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "graph_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_registry" (
    "id" TEXT NOT NULL,
    "scope_type" "DeterministicSourceScope" NOT NULL,
    "scope_id" TEXT,
    "canonical_label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "aliases_json" JSONB NOT NULL DEFAULT '[]',
    "domain_tags_json" JSONB NOT NULL DEFAULT '[]',
    "tier2_json" JSONB NOT NULL DEFAULT '[]',
    "stats_json" JSONB NOT NULL DEFAULT '{}',
    "status" "DeterministicSourceStatus" NOT NULL DEFAULT 'CANDIDATE',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "topic_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_aliases" (
    "id" TEXT NOT NULL,
    "registry_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "topic_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edge_priors" (
    "id" TEXT NOT NULL,
    "scope_type" "DeterministicSourceScope" NOT NULL,
    "scope_id" TEXT,
    "from_slug" TEXT NOT NULL,
    "to_slug" TEXT NOT NULL,
    "edge_type" "EdgeType" NOT NULL,
    "direction" TEXT,
    "prior_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "evidence_count" INTEGER NOT NULL DEFAULT 0,
    "vote_score" INTEGER NOT NULL DEFAULT 0,
    "performance_json" JSONB NOT NULL DEFAULT '{}',
    "rationale_json" JSONB NOT NULL DEFAULT '{}',
    "status" "DeterministicSourceStatus" NOT NULL DEFAULT 'CANDIDATE',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "edge_priors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deterministic_build_runs" (
    "id" TEXT NOT NULL,
    "scope_type" "DeterministicSourceScope" NOT NULL,
    "scope_id" TEXT,
    "content_id" TEXT,
    "mode" TEXT,
    "dry_run" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "summary_json" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    CONSTRAINT "deterministic_build_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "determinism_scores" (
    "id" TEXT NOT NULL,
    "scope_type" "GraphScopeType" NOT NULL,
    "scope_id" TEXT,
    "content_id" TEXT NOT NULL,
    "chunk_id" TEXT,
    "chunk_index" INTEGER,
    "page_number" INTEGER,
    "timestamp_ms" INTEGER,
    "dcs" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "w_det" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "w_llm" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "components_json" JSONB NOT NULL DEFAULT '{}',
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "determinism_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_weight_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" TEXT,
    "content_id" TEXT,
    "section_ref_json" JSONB NOT NULL DEFAULT '{}',
    "dcs" DOUBLE PRECISION NOT NULL,
    "w_det" DOUBLE PRECISION NOT NULL,
    "w_llm" DOUBLE PRECISION NOT NULL,
    "action" TEXT NOT NULL,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decision_weight_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "graph_diffs_user_id_content_id_idx" ON "graph_diffs" ("user_id", "content_id");

-- CreateIndex
CREATE INDEX "topic_registry_scope_type_scope_id_canonical_label_idx" ON "topic_registry" ("scope_type", "scope_id", "canonical_label");

-- CreateIndex
CREATE UNIQUE INDEX "topic_registry_scope_type_scope_id_slug_key" ON "topic_registry" ("scope_type", "scope_id", "slug");

-- CreateIndex
CREATE INDEX "topic_aliases_normalized_idx" ON "topic_aliases" ("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "topic_aliases_registry_id_normalized_key" ON "topic_aliases" ("registry_id", "normalized");

-- CreateIndex
CREATE INDEX "edge_priors_scope_type_scope_id_edge_type_idx" ON "edge_priors" ("scope_type", "scope_id", "edge_type");

-- CreateIndex
CREATE UNIQUE INDEX "edge_priors_scope_type_scope_id_from_slug_to_slug_edge_type_key" ON "edge_priors" (
    "scope_type",
    "scope_id",
    "from_slug",
    "to_slug",
    "edge_type"
);

-- CreateIndex
CREATE INDEX "deterministic_build_runs_scope_type_scope_id_idx" ON "deterministic_build_runs" ("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "deterministic_build_runs_content_id_idx" ON "deterministic_build_runs" ("content_id");

-- CreateIndex
CREATE INDEX "determinism_scores_scope_type_scope_id_content_id_idx" ON "determinism_scores" ("scope_type", "scope_id", "content_id");

-- CreateIndex
CREATE INDEX "determinism_scores_content_id_chunk_id_page_number_timestam_idx" ON "determinism_scores" (
    "content_id",
    "chunk_id",
    "page_number",
    "timestamp_ms"
);

-- CreateIndex
CREATE INDEX "decision_weight_events_session_id_idx" ON "decision_weight_events" ("session_id");

-- CreateIndex
CREATE INDEX "decision_weight_events_content_id_idx" ON "decision_weight_events" ("content_id");

-- AddForeignKey
ALTER TABLE "topic_aliases" ADD CONSTRAINT "topic_aliases_registry_id_fkey" FOREIGN KEY ("registry_id") REFERENCES "topic_registry" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Hourly Activity Cache (30-minute granularity)
CREATE TABLE "hourly_activity_cache" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "time_slot" VARCHAR(5) NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hourly_activity_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hourly_activity_cache_user_period_idx" ON "hourly_activity_cache" ("user_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_activity_cache_user_period_slot_key" ON "hourly_activity_cache" ("user_id", "period", "time_slot");

-- AddForeignKey
ALTER TABLE "hourly_activity_cache" ADD CONSTRAINT "hourly_activity_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;