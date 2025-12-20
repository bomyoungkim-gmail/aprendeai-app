import api from '../api';
import { Family, CreateFamilyDto, InviteMemberDto, FamilyUsageStats } from '../types/family';

export const familyApi = {
  getFamilies: async (): Promise<Family[]> => {
    const { data } = await api.get<Family[]>('/families');
    return data;
  },

  getFamily: async (id: string): Promise<Family> => {
    const { data } = await api.get<Family>(`/families/${id}`);
    return data;
  },

  getUsage: async (id: string): Promise<FamilyUsageStats> => {
    const { data } = await api.get<FamilyUsageStats>(`/families/${id}/usage`);
    return data;
  },

  createFamily: async (dto: CreateFamilyDto): Promise<Family> => {
    const { data } = await api.post<Family>('/families', dto);
    return data;
  },

  inviteMember: async (familyId: string, dto: InviteMemberDto): Promise<void> => {
    await api.post(`/families/${familyId}/invite`, dto);
  },

  acceptInvite: async (familyId: string): Promise<void> => {
    await api.post(`/families/${familyId}/accept`);
  },

  removeMember: async (familyId: string, memberUserId: string): Promise<void> => {
    await api.delete(`/families/${familyId}/members/${memberUserId}`);
  },

  deleteFamily: async (familyId: string): Promise<void> => {
    await api.delete(`/families/${familyId}`);
  },

  setPrimary: async (familyId: string): Promise<void> => {
    await api.post(`/families/${familyId}/primary`);
  },
};

