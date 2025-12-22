-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'GUARDIAN';
ALTER TYPE "UserRole" ADD VALUE 'SCHOOL_ADMIN';

-- CreateTable
CREATE TABLE "extension_device_auth" (
    "id" TEXT NOT NULL,
    "device_code" TEXT NOT NULL,
    "user_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "client_id" TEXT NOT NULL DEFAULT 'browser-extension',
    "requested_scopes" JSONB NOT NULL DEFAULT '[]',
    "user_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extension_device_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_grants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL DEFAULT 'browser-extension',
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "access_token_jti" TEXT,
    "refresh_token" TEXT,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "extension_device_auth_device_code_key" ON "extension_device_auth"("device_code");

-- CreateIndex
CREATE UNIQUE INDEX "extension_device_auth_user_code_key" ON "extension_device_auth"("user_code");

-- CreateIndex
CREATE INDEX "extension_device_auth_device_code_idx" ON "extension_device_auth"("device_code");

-- CreateIndex
CREATE INDEX "extension_device_auth_user_code_idx" ON "extension_device_auth"("user_code");

-- CreateIndex
CREATE INDEX "extension_device_auth_status_expires_at_idx" ON "extension_device_auth"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "extension_grants_refresh_token_key" ON "extension_grants"("refresh_token");

-- CreateIndex
CREATE INDEX "extension_grants_user_id_idx" ON "extension_grants"("user_id");

-- CreateIndex
CREATE INDEX "extension_grants_access_token_jti_idx" ON "extension_grants"("access_token_jti");

-- CreateIndex
CREATE INDEX "extension_grants_refresh_token_idx" ON "extension_grants"("refresh_token");

-- AddForeignKey
ALTER TABLE "extension_device_auth" ADD CONSTRAINT "extension_device_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_grants" ADD CONSTRAINT "extension_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
