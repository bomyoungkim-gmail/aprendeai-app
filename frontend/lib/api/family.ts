import api from '../api';
import { API_ENDPOINTS } from '../config/api';
import { Family, CreateFamilyDto, InviteMemberDto, FamilyUsageStats } from '../types/family';

export const familyApi = {
  getFamilies: async (): Promise<Family[]> => {
    const { data } = await api.get<Family[]>(API_ENDPOINTS.FAMILIES);
    return data;
  },

  getFamily: async (id: string): Promise<Family> => {
    const { data } = await api.get<Family>(API_ENDPOINTS.FAMILY(id));
    return data;
  },

  getUsage: async (id: string): Promise<FamilyUsageStats> => {
    const { data } = await api.get<FamilyUsageStats>(API_ENDPOINTS.FAMILY_USAGE(id));
    return data;
  },

  createFamily: async (dto: CreateFamilyDto): Promise<Family> => {
    const { data } = await api.post<Family>(API_ENDPOINTS.FAMILIES, dto);
    return data;
  },

  inviteMember: async (familyId: string, dto: InviteMemberDto): Promise<void> => {
    await api.post(API_ENDPOINTS.FAMILY_INVITE(familyId), dto);
  },

  acceptInvite: async (familyId: string): Promise<void> => {
    await api.post(`${API_ENDPOINTS.FAMILY(familyId)}/accept`);
  },

  removeMember: async (familyId: string, memberUserId: string): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.FAMILY_MEMBERS(familyId)}/${memberUserId}`);
  },

  deleteFamily: async (familyId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.FAMILY(familyId));
  },

  setPrimary: async (familyId: string): Promise<void> => {
    await api.post(`${API_ENDPOINTS.FAMILY(familyId)}/primary`);
  },
};

