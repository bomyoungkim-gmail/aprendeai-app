import { AssessmentQuestion } from "./assessment-question.entity";

export class Assessment {
  id: string;
  contentId: string;
  contentVersionId?: string;
  schoolingLevelTarget: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  questions?: AssessmentQuestion[];

  constructor(partial: Partial<Assessment>) {
    Object.assign(this, partial);
  }
}
