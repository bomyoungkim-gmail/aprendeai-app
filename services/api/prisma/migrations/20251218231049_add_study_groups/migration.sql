-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'MOD', 'MEMBER');

-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'REMOVED');

-- CreateEnum
CREATE TYPE "GroupSessionMode" AS ENUM ('PI_SPRINT', 'JIGSAW_MICRO', 'TBL_LITE');

-- CreateEnum
CREATE TYPE "GroupSessionStatus" AS ENUM ('CREATED', 'RUNNING', 'POST', 'FINISHED');

-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('FACILITATOR', 'TIMEKEEPER', 'CLARIFIER', 'CONNECTOR', 'SCRIBE');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('CREATED', 'VOTING', 'DISCUSSING', 'REVOTING', 'EXPLAINING', 'DONE');

-- CreateTable
CREATE TABLE "study_groups" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "scope_type" "SubscriptionScope",
    "scope_id" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_members" (
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL,
    "status" "GroupMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_members_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateTable
CREATE TABLE "group_contents" (
    "group_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "added_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_contents_pkey" PRIMARY KEY ("group_id","content_id")
);

-- CreateTable
CREATE TABLE "group_sessions" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "mode" "GroupSessionMode" NOT NULL DEFAULT 'PI_SPRINT',
    "layer" TEXT NOT NULL DEFAULT 'L1',
    "status" "GroupSessionStatus" NOT NULL DEFAULT 'CREATED',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_session_members" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_role" "SessionRole" NOT NULL,
    "attendance_status" TEXT NOT NULL DEFAULT 'JOINED',

    CONSTRAINT "group_session_members_pkey" PRIMARY KEY ("session_id","user_id")
);

-- CreateTable
CREATE TABLE "group_rounds" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "round_index" INTEGER NOT NULL,
    "round_type" TEXT NOT NULL DEFAULT 'PI',
    "prompt_json" JSONB NOT NULL,
    "timing_json" JSONB NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'CREATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "round_id" TEXT,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_cards" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "card_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_groups_owner_user_id_idx" ON "study_groups"("owner_user_id");

-- CreateIndex
CREATE INDEX "study_groups_scope_type_scope_id_idx" ON "study_groups"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "study_group_members_user_id_idx" ON "study_group_members"("user_id");

-- CreateIndex
CREATE INDEX "group_sessions_group_id_idx" ON "group_sessions"("group_id");

-- CreateIndex
CREATE INDEX "group_sessions_status_idx" ON "group_sessions"("status");

-- CreateIndex
CREATE INDEX "group_rounds_session_id_idx" ON "group_rounds"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_rounds_session_id_round_index_key" ON "group_rounds"("session_id", "round_index");

-- CreateIndex
CREATE INDEX "group_events_session_id_idx" ON "group_events"("session_id");

-- CreateIndex
CREATE INDEX "group_events_round_id_idx" ON "group_events"("round_id");

-- CreateIndex
CREATE INDEX "group_events_event_type_idx" ON "group_events"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "shared_cards_round_id_key" ON "shared_cards"("round_id");

-- AddForeignKey
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_contents" ADD CONSTRAINT "group_contents_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_contents" ADD CONSTRAINT "group_contents_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_session_members" ADD CONSTRAINT "group_session_members_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_session_members" ADD CONSTRAINT "group_session_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_rounds" ADD CONSTRAINT "group_rounds_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "group_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_cards" ADD CONSTRAINT "shared_cards_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "group_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
