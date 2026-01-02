import { Injectable, Inject } from "@nestjs/common";
import { IClassroomRepository } from "../../domain/interfaces/classroom.repository.interface";

@Injectable()
export class GetEducatorClassroomsUseCase {
  constructor(
    @Inject(IClassroomRepository)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(educatorId: string) {
    const classrooms = await this.classroomRepo.findByEducator(educatorId);

    // Logic to include enrollment count which usually UI asks for
    return Promise.all(
      classrooms.map(async (c) => {
        const enrollmentCount = await this.classroomRepo.countEnrollments(c.id);
        return {
          classroomId: c.id,
          name: c.name,
          gradeLevel: c.gradeLevel ?? "N/A",
          enrollmentCount,
        };
      }),
    );
  }
}
