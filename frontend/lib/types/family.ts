// Family roles (hierarchical/ownership)
export type FamilyRole = 'OWNER' | 'GUARDIAN' | 'CHILD';

// Learning roles (pedagogical context) - optional field
export type FamilyLearningRole = 'EDUCATOR' | 'LEARNER' | 'PEER';

export type FamilyMemberStatus = 'INVITED' | 'ACTIVE' | 'REMOVED';

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
  learningRole?: FamilyLearningRole | null;
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

export interface InviteFamilyMemberDto {
  email: string;
  role: FamilyRole;
  displayName?: string;
}
