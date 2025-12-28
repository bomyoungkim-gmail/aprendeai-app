/**
 * Group Types
 * 
 * Centralized type definitions for Group-related entities.
 */

export interface GroupMember {
  userId: string;
  name: string;
  role: string; // 'owner' | 'member' | 'admin'
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  ownerUserId: string;
  members: GroupMember[];
}
