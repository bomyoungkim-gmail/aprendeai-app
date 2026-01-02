import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IClassroomRepository } from "../../domain/interfaces/classroom.repository.interface";
import { Classroom } from "../../domain/entities/classroom.entity";

@Injectable()
export class GetClassroomUseCase {
  constructor(
    @Inject(IClassroomRepository)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(id: string): Promise<Classroom> {
    const classroom = await this.classroomRepo.findById(id);
    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }
    return classroom;
  }
}
