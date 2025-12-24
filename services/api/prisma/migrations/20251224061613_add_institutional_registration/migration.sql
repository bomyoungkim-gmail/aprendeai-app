/*
  Warnings:

  - You are about to drop the column `password_reset_expires` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_reset_token` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `institutions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sso_subject]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SSOProvider" AS ENUM ('SAML', 'GOOGLE_WORKSPACE', 'MICROSOFT_ENTRA', 'OKTA', 'CUSTOM_OIDC');

-- AlterTable
ALTER TABLE "institutions" ADD COLUMN     "maxMembers" INTEGER,
ADD COLUMN     "requires_approval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "sso_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password_reset_expires",
DROP COLUMN "password_reset_token",
ADD COLUMN     "sso_provider" TEXT,
ADD COLUMN     "sso_subject" TEXT;

-- CreateTable
CREATE TABLE "institution_members" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMON_USER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "institution_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_invites" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMON_USER',
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "invited_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_domains" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "default_role" "UserRole" NOT NULL DEFAULT 'COMMON_USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_user_approvals" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "temp_password_hash" TEXT NOT NULL,
    "requested_role" "UserRole" NOT NULL DEFAULT 'COMMON_USER',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_user_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_configurations" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "provider" "SSOProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "entity_id" TEXT,
    "sso_url" TEXT,
    "certificate" TEXT,
    "client_id" TEXT,
    "client_secret" TEXT,
    "auth_url" TEXT,
    "token_url" TEXT,
    "user_info_url" TEXT,
    "email_attribute" TEXT DEFAULT 'email',
    "name_attribute" TEXT DEFAULT 'name',
    "role_attribute" TEXT,
    "role_mapping" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "institution_members_institution_id_status_idx" ON "institution_members"("institution_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "institution_members_institution_id_user_id_key" ON "institution_members"("institution_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "institution_invites_token_key" ON "institution_invites"("token");

-- CreateIndex
CREATE INDEX "institution_invites_token_idx" ON "institution_invites"("token");

-- CreateIndex
CREATE INDEX "institution_invites_email_idx" ON "institution_invites"("email");

-- CreateIndex
CREATE INDEX "institution_invites_institution_id_email_idx" ON "institution_invites"("institution_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "institution_domains_domain_key" ON "institution_domains"("domain");

-- CreateIndex
CREATE INDEX "institution_domains_domain_idx" ON "institution_domains"("domain");

-- CreateIndex
CREATE INDEX "pending_user_approvals_institution_id_status_idx" ON "pending_user_approvals"("institution_id", "status");

-- CreateIndex
CREATE INDEX "pending_user_approvals_email_idx" ON "pending_user_approvals"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sso_configurations_institution_id_key" ON "sso_configurations"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_slug_key" ON "institutions"("slug");

-- CreateIndex
CREATE INDEX "institutions_slug_idx" ON "institutions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_sso_subject_key" ON "users"("sso_subject");

-- AddForeignKey
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_invites" ADD CONSTRAINT "institution_invites_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_invites" ADD CONSTRAINT "institution_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_domains" ADD CONSTRAINT "institution_domains_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_user_approvals" ADD CONSTRAINT "pending_user_approvals_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_user_approvals" ADD CONSTRAINT "pending_user_approvals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_configurations" ADD CONSTRAINT "sso_configurations_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
