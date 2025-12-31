import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IClassroomRepository } from '../../domain/interfaces/classroom.repository.interface';
import { Classroom } from '../../domain/entities/classroom.entity';

@Injectable()
export class UpdateClassroomUseCase {
  constructor(
    @Inject(IClassroomRepository) private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(id: string, dto: { name?: string; gradeLevel?: string }): Promise<Classroom> {
    const existing = await this.classroomRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    const updated = new Classroom(
      existing.id,
      dto.name ?? existing.name,
      existing.ownerEducatorId,
      existing.institutionId,
      dto.gradeLevel ?? existing.gradeLevel,
      new Date(),
    );

    return this.classroomRepo.update(updated);
  }
}
