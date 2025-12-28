/**
 * Groups API Service
 * 
 * Pure API calls for study groups.
 * No business logic - just HTTP requests.
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';
import type { CreateGroupDto, InviteStudyMemberDto } from '@/lib/types/study-groups';

// ========================================
// API CALLS
// ========================================

export const groupsApi = {
  /**
   * Get all study groups
   */
  getGroups: async () => {
    const { data } = await api.get(API_ENDPOINTS.STUDY_GROUPS);
    return data;
  },

  /**
   * Get single group by ID
   */
  getGroup: async (id: string) => {
    const { data } = await api.get(API_ENDPOINTS.STUDY_GROUP(id));
    return data;
  },

  /**
   * Create new group
   */
  createGroup: async (payload: CreateGroupDto) => {
    const { data } = await api.post(API_ENDPOINTS.STUDY_GROUPS, payload);
    return data;
  },

  /**
   * Invite member to group
   */
  inviteMember: async (groupId: string, payload: InviteStudyMemberDto) => {
    const { data } = await api.post(`${API_ENDPOINTS.STUDY_GROUP(groupId)}/members/invite`, payload);
    return data;
  },

  /**
   * Remove member from group
   */
  removeMember: async (groupId: string, userId: string) => {
    const { data } = await api.delete(`${API_ENDPOINTS.STUDY_GROUP(groupId)}/members/${userId}`);
    return data;
  },

  /**
   * Delete group
   */
  deleteGroup: async (id: string) => {
    const { data } = await api.delete(API_ENDPOINTS.STUDY_GROUP(id));
    return data;
  },
};
