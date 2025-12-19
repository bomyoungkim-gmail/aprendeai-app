-- CreateIndex
CREATE INDEX "shared_cards_session_id_idx" ON "shared_cards"("session_id");

-- AddForeignKey
ALTER TABLE "shared_cards" ADD CONSTRAINT "shared_cards_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
