-- AddGroupChatMessage
-- Check if exists first
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'group_chat_messages') THEN
    RAISE NOTICE 'Table group_chat_messages already exists, skipping';
  ELSE
    CREATE TABLE "group_chat_messages" (
      "id" TEXT NOT NULL,
      "session_id" TEXT NOT NULL,
      "round_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "group_chat_messages_pkey" PRIMARY KEY ("id")
    );

    CREATE INDEX "group_chat_messages_session_id_round_id_idx" ON "group_chat_messages"("session_id", "round_id");
    CREATE INDEX "group_chat_messages_created_at_idx" ON "group_chat_messages"("created_at");

    ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "group_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE;
  END IF;
END $$;
