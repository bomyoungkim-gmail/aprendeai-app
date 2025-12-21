/*
Warnings:

- A unique constraint covering the columns `[oauth_provider,oauth_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
-- ALTER TABLE "group_chat_messages" DROP CONSTRAINT "group_chat_messages_user_id_fkey";
-- AlterTable
ALTER TABLE "users"
ADD COLUMN "oauth_id" TEXT,
ADD COLUMN "oauth_picture" TEXT,
ADD COLUMN "oauth_provider" TEXT,
ALTER COLUMN "password_hash"
DROP NOT NULL;

-- CreateIndex
CREATE INDEX "contents_title_idx" ON "contents" ("title");

-- CreateIndex
CREATE INDEX "contents_owner_user_id_idx" ON "contents" ("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_provider_oauth_id_key" ON "users" ("oauth_provider", "oauth_id");

-- AddForeignKey
-- ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;