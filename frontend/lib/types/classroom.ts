export interface Classroom {
  id: string;
  name: string;
  gradeLevel?: string;
  ownerEducatorUserId: string;
  institutionId?: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface CreateClassroomDto {
  ownerEducatorUserId: string;
  name: string;
  institutionId?: string;
  gradeLevel?: string;
}

export interface UpdateClassroomDto {
  name?: string;
  gradeLevel?: string;
}

export interface EnrollStudentDto {
  learnerUserId: string;
  nickname?: string;
}

export interface GradebookStudentRow {
  studentId: string;
  name: string;
  email: string;
  scores: Record<string, number>;
}

export interface GradebookGrid {
  contentIds: string[];
  data: GradebookStudentRow[];
}
