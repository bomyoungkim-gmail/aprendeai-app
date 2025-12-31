export class Classroom {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ownerEducatorId: string,
    public readonly institutionId: string,
    public readonly gradeLevel?: string,
    public readonly updatedAt: Date = new Date(),
  ) {}
}
