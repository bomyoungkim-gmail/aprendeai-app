export enum ShareContextType {
  CLASSROOM = "CLASSROOM",
  STUDY_GROUP = "STUDY_GROUP",
  FAMILY = "FAMILY",
}

export enum SharePermission {
  VIEW = "VIEW",
  COMMENT = "COMMENT",
  ASSIGN = "ASSIGN",
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
