export interface Institution {
  id: string;
  name: string;
  type: string;
  slug?: string;
  city?: string;
  state?: string;
  country?: string;
  maxMembers?: number;
  requiresApproval?: boolean;
}

export interface TeacherApproval {
  id: string;
  institutionId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
}

export interface ProcessApprovalDto {
  approve: boolean;
  reason?: string;
}
