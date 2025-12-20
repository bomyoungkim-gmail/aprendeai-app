export type FamilyRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'CHILD';
export type FamilyMemberStatus = 'ACTIVE' | 'INVITED' | 'INACTIVE';

export interface UsageMetric {
  quantity: number;
  cost: number;
  count: number;
}

export interface FamilyUsageStats {
  range: string;
  metrics: Record<string, UsageMetric>;
  totalCost: number;
  recentEvents: any[];
}


export interface FamilyMember {
  id: string;
  userId: string;
  familyId: string;
  role: FamilyRole;
  status: FamilyMemberStatus;
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  ownerId: string;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFamilyDto {
  name: string;
}

export interface InviteMemberDto {
  email: string;
  role: FamilyRole;
  displayName?: string;
}
