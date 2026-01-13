import { PkmNote } from "../entities/pkm-note.entity";
import { PkmNoteStatus } from "@prisma/client";

export interface IPkmNoteRepository {
  /**
   * Create a new PKM note
   */
  create(note: PkmNote): Promise<PkmNote>;

  /**
   * Find PKM notes by user ID with optional pagination
   */
  findByUserId(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<PkmNote[]>;

  /**
   * Find PKM notes by content ID
   */
  findByContentId(contentId: string): Promise<PkmNote[]>;

  /**
   * Find PKM notes by session ID
   */
  findBySessionId(sessionId: string): Promise<PkmNote[]>;

  /**
   * Find PKM notes by topic node ID (for collaborative graph annotations)
   */
  findByTopicNodeId(
    topicNodeId: string,
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<PkmNote[]>;

  /**
   * Find a single PKM note by ID
   */
  findById(id: string): Promise<PkmNote | null>;

  /**
   * Update a PKM note
   */
  update(id: string, data: Partial<PkmNote>): Promise<PkmNote>;

  /**
   * Update PKM note status
   */
  updateStatus(id: string, status: PkmNoteStatus): Promise<PkmNote>;

  /**
   * Delete a PKM note (soft delete by setting status to ARCHIVED)
   */
  delete(id: string): Promise<void>;

  /**
   * Hard delete a PKM note (permanent removal)
   */
  hardDelete(id: string): Promise<void>;

  /**
   * Count PKM notes by user ID and optional status filter
   */
  countByUserId(userId: string, status?: PkmNoteStatus): Promise<number>;
}

export const IPkmNoteRepository = Symbol("IPkmNoteRepository");
