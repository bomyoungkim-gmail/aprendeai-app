import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IClassroomRepository } from "../../domain/interfaces/classroom.repository.interface";
import { Classroom } from "../../domain/entities/classroom.entity";

@Injectable()
export class PrismaClassroomRepository implements IClassroomRepository {
  constructor(private prisma: PrismaService) {}

  async create(classroom: Classroom): Promise<Classroom> {
    const created = await this.prisma.classrooms.create({
      data: {
        id: classroom.id,
        name: classroom.name,
        owner_educator_id: classroom.ownerEducatorId,
        institution_id: classroom.institutionId,
        grade_level: classroom.gradeLevel,
        updated_at: classroom.updatedAt,
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Classroom | null> {
    const classroom = await this.prisma.classrooms.findUnique({
      where: { id },
    });

    if (!classroom) return null;
    return this.mapToEntity(classroom);
  }

  async findByEducator(educatorId: string): Promise<Classroom[]> {
    const classrooms = await this.prisma.classrooms.findMany({
      where: { owner_educator_id: educatorId },
    });

    return classrooms.map((c) => this.mapToEntity(c));
  }

  async update(classroom: Classroom): Promise<Classroom> {
    const updated = await this.prisma.classrooms.update({
      where: { id: classroom.id },
      data: {
        name: classroom.name,
        grade_level: classroom.gradeLevel,
        updated_at: classroom.updatedAt,
      },
    });

    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.classrooms.delete({
      where: { id },
    });
  }

  async countEnrollments(classroomId: string): Promise<number> {
    return this.prisma.enrollments.count({
      where: {
        classroom_id: classroomId,
        status: "ACTIVE",
      },
    });
  }

  private mapToEntity(data: any): Classroom {
    return new Classroom(
      data.id,
      data.name,
      data.owner_educator_id,
      data.institution_id,
      data.grade_level,
      data.updated_at,
    );
  }
}
