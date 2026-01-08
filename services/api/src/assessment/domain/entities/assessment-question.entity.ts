export class AssessmentQuestion {
  id: string;
  assessmentId?: string;
  questionType: string;
  questionText: string;
  options: string[] | any; // JSON in prisma
  correctAnswer: any; // JSON in prisma
  skills?: string[]; // Array of strings (mapped from Prisma String[])
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<AssessmentQuestion>) {
    Object.assign(this, partial);
  }
}
