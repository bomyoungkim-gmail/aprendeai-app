-- CreateIndex
CREATE INDEX "user_sessions_list" ON "reading_sessions"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "user_sessions_phase" ON "reading_sessions"("user_id", "phase", "started_at");
