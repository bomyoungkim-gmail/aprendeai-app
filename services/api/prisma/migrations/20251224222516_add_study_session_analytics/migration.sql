-- CreateTable
CREATE TABLE "user_topic_mastery" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "mastery_level" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "questions_attempted" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "time_spent" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_topic_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "net_focus_minutes" INTEGER,
    "focus_score" DOUBLE PRECISION,
    "interruptions" INTEGER NOT NULL DEFAULT 0,
    "activity_type" TEXT NOT NULL,
    "content_id" TEXT,
    "source_id" TEXT,
    "accuracy_rate" DOUBLE PRECISION,
    "engagement_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_topic_mastery_user_id_idx" ON "user_topic_mastery"("user_id");

-- CreateIndex
CREATE INDEX "user_topic_mastery_topic_idx" ON "user_topic_mastery"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "user_topic_mastery_user_id_topic_subject_key" ON "user_topic_mastery"("user_id", "topic", "subject");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_start_time_idx" ON "study_sessions"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_activity_type_idx" ON "study_sessions"("user_id", "activity_type");

-- AddForeignKey
ALTER TABLE "user_topic_mastery" ADD CONSTRAINT "user_topic_mastery_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
