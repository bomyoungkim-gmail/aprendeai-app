import { Injectable } from "@nestjs/common";
import { CreateClassroomDto, UpdateClassroomDto } from "../dto/classroom.dto";
import { CreateClassroomUseCase } from "../application/use-cases/create-classroom.use-case";
import { GetClassroomUseCase } from "../application/use-cases/get-classroom.use-case";
import { UpdateClassroomUseCase } from "../application/use-cases/update-classroom.use-case";
import { DeleteClassroomUseCase } from "../application/use-cases/delete-classroom.use-case";
import { GetEducatorClassroomsUseCase } from "../application/use-cases/get-educator-classrooms.use-case";

@Injectable()
export class ClassroomService {
  constructor(
    private readonly createUseCase: CreateClassroomUseCase,
    private readonly getUseCase: GetClassroomUseCase,
    private readonly updateUseCase: UpdateClassroomUseCase,
    private readonly deleteUseCase: DeleteClassroomUseCase,
    private readonly getEducatorClassroomsUseCase: GetEducatorClassroomsUseCase,
  ) {}

  /**
   * Create a new classroom
   */
  async create(dto: CreateClassroomDto) {
    return this.createUseCase.execute({
      name: dto.name,
      ownerEducatorId: dto.ownerEducatorUserId,
      institutionId: dto.institutionId as string,
      gradeLevel: dto.gradeLevel,
    });
  }

  /**
   * Get classroom by ID
   */
  async getById(classroomId: string) {
    return this.getUseCase.execute(classroomId);
  }

  /**
   * Get all classrooms for an educator
   */
  async getByEducator(educatorUserId: string) {
    return this.getEducatorClassroomsUseCase.execute(educatorUserId);
  }

  /**
   * Update classroom
   */
  async update(classroomId: string, dto: UpdateClassroomDto) {
    return this.updateUseCase.execute(classroomId, dto);
  }

  /**
   * Delete classroom
   */
  async delete(classroomId: string) {
    return this.deleteUseCase.execute(classroomId);
  }
}
