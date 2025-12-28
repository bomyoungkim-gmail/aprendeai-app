import api from '../api';
import { API_ENDPOINTS } from '../config/api';
import { Family, CreateFamilyDto, InviteFamilyMemberDto, FamilyUsageStats } from '../types/family';

export const familyApi = {
  getFamilies: async (): Promise<Family[]> => {
    const { data } = await api.get<Family[]>(API_ENDPOINTS.FAMILY.LIST);
    return data;
  },

  getFamily: async (id: string): Promise<Family> => {
    const { data } = await api.get<Family>(API_ENDPOINTS.FAMILY.DETAILS(id));
    return data;
  },

  getUsage: async (id: string): Promise<FamilyUsageStats> => {
    const { data } = await api.get<FamilyUsageStats>(API_ENDPOINTS.FAMILY.USAGE(id));
    return data;
  },

  createFamily: async (dto: CreateFamilyDto): Promise<Family> => {
    const { data } = await api.post<Family>(API_ENDPOINTS.FAMILY.CREATE, dto);
    return data;
  },

  inviteMember: async (familyId: string, dto: InviteFamilyMemberDto): Promise<void> => {
    await api.post(API_ENDPOINTS.FAMILY.INVITE(familyId), dto);
  },

  acceptInvite: async (familyId: string): Promise<void> => {
    await api.post(API_ENDPOINTS.FAMILY.ACCEPT_INVITE(familyId));
  },

  removeMember: async (familyId: string, memberUserId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.FAMILY.REMOVE_MEMBER(familyId, memberUserId));
  },

  deleteFamily: async (familyId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.FAMILY.DETAILS(familyId));
  },

  setPrimary: async (familyId: string): Promise<void> => {
    await api.post(`${API_ENDPOINTS.FAMILY.DETAILS(familyId)}/primary`);
  },
};

