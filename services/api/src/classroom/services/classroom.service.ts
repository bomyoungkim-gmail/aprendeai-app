import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ClassroomEventService } from "../../events/classroom-event.service";
import { CreateClassroomDto, UpdateClassroomDto } from "../dto/classroom.dto";

@Injectable()
export class ClassroomService {
  constructor(
    private prisma: PrismaService,
    private classroomEventService: ClassroomEventService,
  ) {}

  /**
   * Create a new classroom
   */
  async create(dto: CreateClassroomDto) {
    const classroom = await this.prisma.classroom.create({
      data: {
        ownerEducatorUserId: dto.ownerEducatorUserId,
        name: dto.name,
        institutionId: dto.institutionId,
        gradeLevel: dto.gradeLevel,
      },
    });

    return classroom;
  }

  /**
   * Get classroom by ID with enrollments
   */
  async getById(classroomId: string) {
    return this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        owner: true,
        enrollments: {
          include: {
            learner: true,
          },
        },
        weeklyPlans: true,
      },
    });
  }

  /**
   * Get all classrooms for an educator (optimized for browser extension)
   */
  async getByEducator(educatorUserId: string) {
    const classrooms = await this.prisma.classroom.findMany({
      where: {
        ownerEducatorUserId: educatorUserId,
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return {
      classrooms: classrooms.map((c) => ({
        classroomId: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel || "N/A",
        enrollmentCount: c._count.enrollments,
      })),
    };
  }

  /**
   * Update classroom
   */
  async update(classroomId: string, dto: UpdateClassroomDto) {
    return this.prisma.classroom.update({
      where: { id: classroomId },
      data: dto,
    });
  }

  /**
   * Delete classroom
   * @throws BadRequestException if classroom has active enrollments
   */
  async delete(classroomId: string) {
    try {
      return await this.prisma.classroom.delete({
        where: { id: classroomId },
      });
    } catch (error) {
      // Prisma error code P2003: Foreign key constraint failed
      if (error.code === "P2003") {
        throw new BadRequestException(
          "Cannot delete classroom with active enrollments. Remove all students first.",
        );
      }
      // Prisma error code P2025: Record not found
      if (error.code === "P2025") {
        throw new BadRequestException(`Classroom ${classroomId} not found`);
      }
      throw error;
    }
  }
}
