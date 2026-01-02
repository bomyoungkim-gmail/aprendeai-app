export type EnrollmentStatus = "ACTIVE" | "REMOVED";

export class Enrollment {
  constructor(
    public readonly id: string,
    public readonly classroomId: string,
    public readonly learnerUserId: string,
    public readonly nickname?: string,
    public readonly status: EnrollmentStatus = "ACTIVE",
    public readonly enrolledAt: Date = new Date(),
  ) {}
}
