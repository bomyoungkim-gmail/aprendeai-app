import { Assessment } from "./assessment.entity";

export class AssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  scoreRaw: number;
  scorePercent: number;
  startedAt?: Date; // Optional if not tracking start time explicitly in DB yet
  finishedAt: Date;
  createdAt?: Date;

  // Relations
  assessment?: Assessment;

  constructor(partial: Partial<AssessmentAttempt>) {
    Object.assign(this, partial);
  }
}
