export enum ShareContextType {
  CLASSROOM = 'CLASSROOM',
  STUDY_GROUP = 'STUDY_GROUP',
  FAMILY = 'FAMILY',
  PUBLIC = 'PUBLIC',
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ASSIGN = 'ASSIGN',
}

export class ContentShare {
  constructor(
    public readonly contentId: string,
    public readonly contextType: ShareContextType,
    public readonly contextId: string,
    public readonly permission: SharePermission,
    public readonly createdBy: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}
