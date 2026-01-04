-- CreateEnum
CREATE TYPE "GraphType" AS ENUM ('BASELINE', 'LEARNER', 'CURATED');

-- CreateEnum
CREATE TYPE "GraphScopeType" AS ENUM ('USER', 'FAMILY', 'INSTITUTION', 'STUDY_GROUP', 'GLOBAL');

-- CreateEnum
CREATE TYPE "GraphSource" AS ENUM ('PREPROCESS', 'DETERMINISTIC', 'USER', 'TEACHER', 'LLM');

-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('PREREQUISITE', 'SUPPORTS', 'EXPLAINS', 'CAUSES', 'CONTRASTS', 'ANALOGY', 'PART_OF', 'APPLIES_IN', 'EXAMPLE_OF', 'MENTIONS', 'COVERS', 'LINKS_TO');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('CHUNK', 'PAGE_AREA', 'TIMESTAMP', 'HIGHLIGHT', 'CORNELL_CUE', 'CORNELL_SUMMARY');

-- CreateTable
CREATE TABLE "topic_graphs" (
    "id" TEXT NOT NULL,
    "type" "GraphType" NOT NULL,
    "scope_type" "GraphScopeType" NOT NULL,
    "scope_id" TEXT,
    "content_id" TEXT,
    "title" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "policy_version" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_graphs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_nodes" (
    "id" TEXT NOT NULL,
    "graph_id" TEXT NOT NULL,
    "canonical_label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "aliases_json" JSONB NOT NULL DEFAULT '[]',
    "domain_tags_json" JSONB NOT NULL DEFAULT '[]',
    "tier2_json" JSONB NOT NULL DEFAULT '[]',
    "attributes_json" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" "GraphSource" NOT NULL DEFAULT 'DETERMINISTIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_edges" (
    "id" TEXT NOT NULL,
    "graph_id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "edge_type" "EdgeType" NOT NULL,
    "direction" TEXT,
    "rationale_json" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" "GraphSource" NOT NULL DEFAULT 'DETERMINISTIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_edge_evidence" (
    "id" TEXT NOT NULL,
    "edge_id" TEXT NOT NULL,
    "evidence_type" "EvidenceType" NOT NULL,
    "content_id" TEXT,
    "chunk_id" TEXT,
    "chunk_index" INTEGER,
    "page_number" INTEGER,
    "timestamp_ms" INTEGER,
    "anchor_json" JSONB,
    "highlight_id" TEXT,
    "cornell_note_id" TEXT,
    "excerpt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_edge_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_edge_votes" (
    "id" TEXT NOT NULL,
    "edge_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_edge_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topic_graphs_type_scope_type_scope_id_idx" ON "topic_graphs"("type", "scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "topic_graphs_content_id_type_idx" ON "topic_graphs"("content_id", "type");

-- CreateIndex
CREATE INDEX "topic_nodes_graph_id_canonical_label_idx" ON "topic_nodes"("graph_id", "canonical_label");

-- CreateIndex
CREATE UNIQUE INDEX "topic_nodes_graph_id_slug_key" ON "topic_nodes"("graph_id", "slug");

-- CreateIndex
CREATE INDEX "topic_edges_graph_id_edge_type_idx" ON "topic_edges"("graph_id", "edge_type");

-- CreateIndex
CREATE INDEX "topic_edges_from_node_id_to_node_id_idx" ON "topic_edges"("from_node_id", "to_node_id");

-- CreateIndex
CREATE INDEX "topic_edge_evidence_edge_id_idx" ON "topic_edge_evidence"("edge_id");

-- CreateIndex
CREATE INDEX "topic_edge_evidence_content_id_idx" ON "topic_edge_evidence"("content_id");

-- CreateIndex
CREATE INDEX "topic_edge_evidence_chunk_id_page_number_timestamp_ms_idx" ON "topic_edge_evidence"("chunk_id", "page_number", "timestamp_ms");

-- CreateIndex
CREATE INDEX "topic_edge_votes_edge_id_idx" ON "topic_edge_votes"("edge_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_edge_votes_edge_id_user_id_key" ON "topic_edge_votes"("edge_id", "user_id");

-- CreateIndex
CREATE INDEX "game_results_content_id_idx" ON "game_results"("content_id");

-- CreateIndex
CREATE INDEX "game_results_user_id_idx" ON "game_results"("user_id");

-- AddForeignKey
ALTER TABLE "topic_graphs" ADD CONSTRAINT "topic_graphs_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_nodes" ADD CONSTRAINT "topic_nodes_graph_id_fkey" FOREIGN KEY ("graph_id") REFERENCES "topic_graphs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_graph_id_fkey" FOREIGN KEY ("graph_id") REFERENCES "topic_graphs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "topic_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "topic_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edge_evidence" ADD CONSTRAINT "topic_edge_evidence_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "topic_edges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edge_evidence" ADD CONSTRAINT "topic_edge_evidence_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edge_evidence" ADD CONSTRAINT "topic_edge_evidence_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "content_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edge_evidence" ADD CONSTRAINT "topic_edge_evidence_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "highlights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edge_evidence" ADD CONSTRAINT "topic_edge_evidence_cornell_note_id_fkey" FOREIGN KEY ("cornell_note_id") REFERENCES "cornell_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edge_votes" ADD CONSTRAINT "topic_edge_votes_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "topic_edges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_edge_votes" ADD CONSTRAINT "topic_edge_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
