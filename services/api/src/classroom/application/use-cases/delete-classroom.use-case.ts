import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { IClassroomRepository } from "../../domain/interfaces/classroom.repository.interface";

@Injectable()
export class DeleteClassroomUseCase {
  constructor(
    @Inject(IClassroomRepository)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const classroom = await this.classroomRepo.findById(id);
    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    const enrollmentCount = await this.classroomRepo.countEnrollments(id);
    if (enrollmentCount > 0) {
      throw new BadRequestException(
        "Cannot delete classroom with active enrollments. Remove all students first.",
      );
    }

    await this.classroomRepo.delete(id);
  }
}
