import { ShareContextType } from "./content-share.entity";

export enum AnnotationShareMode {
  READ_ONLY = "READ_ONLY",
  COLLABORATIVE = "COLLABORATIVE",
}

export class AnnotationShare {
  constructor(
    public readonly annotationId: string,
    public readonly contextType: ShareContextType,
    public readonly contextId: string,
    public readonly mode: AnnotationShareMode,
    public readonly createdBy: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}
