-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPPORT', 'OPS', 'INSTITUTION_ADMIN', 'TEACHER', 'STUDENT', 'COMMON_USER');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('GLOBAL', 'INSTITUTION', 'USER');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEV', 'STAGING', 'PROD');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'UNIVERSITY', 'COURSE', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('NEWS', 'ARXIV', 'SCHOOL_MATERIAL', 'PDF', 'IMAGE', 'DOCX', 'ARTICLE');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('PT_BR', 'EN', 'KO');

-- CreateEnum
CREATE TYPE "LibraryStatus" AS ENUM ('SAVED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DailyGoalType" AS ENUM ('MINUTES', 'LESSONS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfigType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'SECRET_REF');

-- CreateEnum
CREATE TYPE "SubscriptionScope" AS ENUM ('USER', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('INTERNAL', 'PAYMENT_PROVIDER');

-- CreateEnum
CREATE TYPE "HighlightKind" AS ENUM ('TEXT', 'AREA');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('PDF', 'IMAGE', 'DOCX');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "schooling_level" TEXT NOT NULL,
    "age" INTEGER,
    "sex" TEXT,
    "preferred_languages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_students" (
    "class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,

    CONSTRAINT "class_students_pkey" PRIMARY KEY ("class_id","student_id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "content_id" TEXT,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'AVAILABLE',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT,
    "type" "ContentType" NOT NULL,
    "source_id" TEXT,
    "title" TEXT NOT NULL,
    "original_language" "Language" NOT NULL,
    "raw_text" TEXT NOT NULL,
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "file_id" TEXT,
    "language_guess" TEXT,
    "owner_user_id" TEXT,
    "scopeType" "SubscriptionScope",
    "scope_id" TEXT,
    "source_url" TEXT,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "target_language" "Language" NOT NULL,
    "schooling_level_target" TEXT NOT NULL,
    "simplified_text" TEXT NOT NULL,
    "summary" TEXT,
    "vocabulary_glossary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_library_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_version_id" TEXT,
    "status" "LibraryStatus" NOT NULL DEFAULT 'SAVED',
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_version_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "reading_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_cornell_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reading_session_id" TEXT NOT NULL,
    "main_notes" JSONB NOT NULL,
    "cue_column" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_cornell_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_version_id" TEXT,
    "institution_id" TEXT,
    "schooling_level_target" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "score_raw" DOUBLE PRECISION,
    "score_percent" DOUBLE PRECISION,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" TEXT NOT NULL,
    "assessment_attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_answer" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_spent_seconds" INTEGER,

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_type" "DailyGoalType" NOT NULL,
    "goal_value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "minutes_spent" INTEGER NOT NULL DEFAULT 0,
    "lessons_completed" INTEGER NOT NULL DEFAULT 0,
    "goal_met" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "last_goal_met_date" DATE,
    "freeze_tokens" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocabularies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "mastery_score" INTEGER NOT NULL DEFAULT 0,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "scope_type" "ScopeType",
    "scope_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "actor_role" "UserRole",
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "request_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "before_json" JSONB,
    "after_json" JSONB,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" "Environment",
    "scope_type" "ScopeType",
    "scope_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_secrets" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "encrypted_value" TEXT NOT NULL,
    "encrypted_dek" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "auth_tag" TEXT NOT NULL,
    "key_id" TEXT NOT NULL DEFAULT 'v1',
    "environment" "Environment",
    "last_rotated_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tags" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bucket" TEXT NOT NULL,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "status_code" INTEGER,
    "user_id" TEXT,
    "request_id" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_usage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "tokens" INTEGER,
    "cost" DOUBLE PRECISION,
    "latency" INTEGER,
    "status_code" INTEGER,
    "user_id" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" TEXT NOT NULL,
    "job_name" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "ConfigType" NOT NULL,
    "category" TEXT NOT NULL,
    "environment" "Environment",
    "description" TEXT,
    "metadata" JSONB,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entitlements" JSONB NOT NULL,
    "monthly_price" DOUBLE PRECISION,
    "yearly_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "scope_type" "SubscriptionScope" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "source" "SubscriptionSource" NOT NULL,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "provider_code" TEXT,
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "provider_price_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlement_overrides" (
    "id" TEXT NOT NULL,
    "scope_type" "SubscriptionScope" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "overrides" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlement_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "scope_type" "SubscriptionScope" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "provider_code" TEXT,
    "endpoint" TEXT,
    "metric" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "approx_cost_usd" DOUBLE PRECISION,
    "request_id" TEXT,
    "user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "originalFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cornell_notes" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuesJson" JSONB NOT NULL DEFAULT '[]',
    "notesJson" JSONB NOT NULL DEFAULT '[]',
    "summaryText" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "cornell_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "highlights" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "HighlightKind" NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "pageNumber" INTEGER,
    "anchorJson" JSONB NOT NULL,
    "colorKey" TEXT NOT NULL DEFAULT 'yellow',
    "commentText" TEXT,
    "tagsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_extractions" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "extracted_text_ref" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_chunks" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "page_number" INTEGER,
    "text" TEXT NOT NULL,
    "token_estimate" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_user_id_lesson_id_key" ON "lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activities_user_id_date_key" ON "daily_activities"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabularies_user_id_word_language_key" ON "user_vocabularies"("user_id", "word", "language");

-- CreateIndex
CREATE INDEX "user_role_assignments_user_id_idx" ON "user_role_assignments"("user_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_role_idx" ON "user_role_assignments"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_user_id_role_scope_type_scope_id_key" ON "user_role_assignments"("user_id", "role", "scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_idx" ON "audit_logs"("resource_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_request_id_idx" ON "audit_logs"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "integration_secrets_key_key" ON "integration_secrets"("key");

-- CreateIndex
CREATE INDEX "integration_secrets_key_idx" ON "integration_secrets"("key");

-- CreateIndex
CREATE INDEX "integration_secrets_provider_idx" ON "integration_secrets"("provider");

-- CreateIndex
CREATE INDEX "system_metrics_metric_timestamp_idx" ON "system_metrics"("metric", "timestamp");

-- CreateIndex
CREATE INDEX "system_metrics_bucket_idx" ON "system_metrics"("bucket");

-- CreateIndex
CREATE INDEX "error_logs_timestamp_idx" ON "error_logs"("timestamp");

-- CreateIndex
CREATE INDEX "error_logs_resolved_idx" ON "error_logs"("resolved");

-- CreateIndex
CREATE INDEX "error_logs_endpoint_idx" ON "error_logs"("endpoint");

-- CreateIndex
CREATE INDEX "provider_usage_provider_timestamp_idx" ON "provider_usage"("provider", "timestamp");

-- CreateIndex
CREATE INDEX "provider_usage_user_id_idx" ON "provider_usage"("user_id");

-- CreateIndex
CREATE INDEX "background_jobs_job_name_status_idx" ON "background_jobs"("job_name", "status");

-- CreateIndex
CREATE INDEX "background_jobs_started_at_idx" ON "background_jobs"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "app_configs_key_key" ON "app_configs"("key");

-- CreateIndex
CREATE INDEX "app_configs_key_idx" ON "app_configs"("key");

-- CreateIndex
CREATE INDEX "app_configs_category_idx" ON "app_configs"("category");

-- CreateIndex
CREATE INDEX "app_configs_environment_idx" ON "app_configs"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "plans_code_idx" ON "plans"("code");

-- CreateIndex
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- CreateIndex
CREATE INDEX "subscriptions_scope_type_scope_id_idx" ON "subscriptions"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_scope_status_unique" ON "subscriptions"("scope_type", "scope_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "entitlement_overrides_scope_type_scope_id_key" ON "entitlement_overrides"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "usage_events_scope_type_scope_id_metric_occurred_at_idx" ON "usage_events"("scope_type", "scope_id", "metric", "occurred_at");

-- CreateIndex
CREATE INDEX "usage_events_occurred_at_idx" ON "usage_events"("occurred_at");

-- CreateIndex
CREATE INDEX "usage_events_metric_idx" ON "usage_events"("metric");

-- CreateIndex
CREATE UNIQUE INDEX "billing_events_provider_event_id_key" ON "billing_events"("provider_event_id");

-- CreateIndex
CREATE INDEX "billing_events_provider_code_idx" ON "billing_events"("provider_code");

-- CreateIndex
CREATE INDEX "billing_events_processed_at_idx" ON "billing_events"("processed_at");

-- CreateIndex
CREATE INDEX "files_storageProvider_storageKey_idx" ON "files"("storageProvider", "storageKey");

-- CreateIndex
CREATE INDEX "cornell_notes_contentId_idx" ON "cornell_notes"("contentId");

-- CreateIndex
CREATE INDEX "cornell_notes_userId_idx" ON "cornell_notes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cornell_notes_contentId_userId_key" ON "cornell_notes"("contentId", "userId");

-- CreateIndex
CREATE INDEX "highlights_contentId_idx" ON "highlights"("contentId");

-- CreateIndex
CREATE INDEX "highlights_userId_idx" ON "highlights"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "content_extractions_content_id_key" ON "content_extractions"("content_id");

-- CreateIndex
CREATE INDEX "content_chunks_content_id_idx" ON "content_chunks"("content_id");

-- CreateIndex
CREATE INDEX "content_chunks_page_number_idx" ON "content_chunks"("page_number");

-- CreateIndex
CREATE UNIQUE INDEX "content_chunks_content_id_chunk_index_key" ON "content_chunks"("content_id", "chunk_index");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library_items" ADD CONSTRAINT "user_library_items_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library_items" ADD CONSTRAINT "user_library_items_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library_items" ADD CONSTRAINT "user_library_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_cornell_notes" ADD CONSTRAINT "legacy_cornell_notes_reading_session_id_fkey" FOREIGN KEY ("reading_session_id") REFERENCES "reading_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_cornell_notes" ADD CONSTRAINT "legacy_cornell_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "content_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_assessment_attempt_id_fkey" FOREIGN KEY ("assessment_attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "assessment_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_goals" ADD CONSTRAINT "daily_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabularies" ADD CONSTRAINT "user_vocabularies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cornell_notes" ADD CONSTRAINT "cornell_notes_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cornell_notes" ADD CONSTRAINT "cornell_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_extractions" ADD CONSTRAINT "content_extractions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
