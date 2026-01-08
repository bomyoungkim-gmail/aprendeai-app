/*
  Warnings:

  - You are about to drop the column `oauth_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `oauth_picture` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `oauth_provider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `sso_provider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `sso_subject` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_oauth_provider_oauth_id_key";

-- DropIndex
DROP INDEX "users_sso_subject_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "oauth_id",
DROP COLUMN "oauth_picture",
DROP COLUMN "oauth_provider",
DROP COLUMN "password_hash",
DROP COLUMN "sso_provider",
DROP COLUMN "sso_subject";
