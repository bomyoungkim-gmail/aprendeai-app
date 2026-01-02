import { Injectable, Inject } from "@nestjs/common";
import { IClassroomRepository } from "../../domain/interfaces/classroom.repository.interface";
import { Classroom } from "../../domain/entities/classroom.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CreateClassroomUseCase {
  constructor(
    @Inject(IClassroomRepository)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(dto: {
    name: string;
    ownerEducatorId: string;
    institutionId: string;
    gradeLevel?: string;
  }): Promise<Classroom> {
    const classroom = new Classroom(
      uuidv4(),
      dto.name,
      dto.ownerEducatorId,
      dto.institutionId,
      dto.gradeLevel,
      new Date(),
    );

    return this.classroomRepo.create(classroom);
  }
}
