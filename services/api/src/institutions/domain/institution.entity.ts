export class Institution {
  id: string;
  name: string;
  type: any; // Using any for enum compatibility
  kind: any;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  maxMembers?: number;
  requiresApproval?: boolean;
  slug?: string | null;
  ssoEnabled?: boolean;
  logoUrl?: string | null;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Institution>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }
}
