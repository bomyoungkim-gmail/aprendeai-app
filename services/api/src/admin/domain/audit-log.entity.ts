export class AuditLog {
  id: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  beforeJson?: any;
  afterJson?: any;
  reason?: string | null;
  createdAt: Date;

  constructor(partial: Partial<AuditLog>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
  }
}
