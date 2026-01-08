-- Manual Migration: Add topic_node_id to pkm_notes for collaborative annotations
-- Date: 2026-01-06
-- Description: Links PKM notes to knowledge graph nodes for collaborative learning

-- Add the column
ALTER TABLE "pkm_notes" ADD COLUMN "topic_node_id" TEXT;

-- Create index for performance
CREATE INDEX "pkm_notes_topic_node_id_idx" ON "pkm_notes"("topic_node_id");

-- Add foreign key constraint
ALTER TABLE "pkm_notes" 
ADD CONSTRAINT "pkm_notes_topic_node_id_fkey" 
FOREIGN KEY ("topic_node_id") 
REFERENCES "topic_nodes"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;
