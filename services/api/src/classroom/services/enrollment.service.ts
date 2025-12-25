import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EnrollStudentDto } from "../dto/classroom.dto";

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enroll a student in a classroom
   */
  async enroll(dto: EnrollStudentDto) {
    // Check if already enrolled
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        classroomId: dto.classroomId,
        learnerUserId: dto.learnerUserId,
      },
    });

    if (existing && existing.status === "ACTIVE") {
      throw new BadRequestException(
        "Student already enrolled in this classroom",
      );
    }

    if (existing && existing.status === "REMOVED") {
      // Re-activate enrollment
      return this.prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE" },
      });
    }

    // Create new enrollment
    return this.prisma.enrollment.create({
      data: {
        classroomId: dto.classroomId,
        learnerUserId: dto.learnerUserId,
        nickname: dto.nickname,
        status: "ACTIVE",
      },
      include: {
        classroom: true,
        learner: true,
      },
    });
  }

  /**
   * Remove student from classroom
   */
  async remove(enrollmentId: string) {
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "REMOVED" },
    });
  }

  /**
   * Get all enrollments for a classroom
   */
  async getByClassroom(classroomId: string) {
    return this.prisma.enrollment.findMany({
      where: {
        classroomId,
        status: "ACTIVE",
      },
      include: {
        learner: true,
      },
    });
  }

  /**
   * Get all classrooms a student is enrolled in
   */
  async getByStudent(learnerUserId: string) {
    return this.prisma.enrollment.findMany({
      where: {
        learnerUserId,
        status: "ACTIVE",
      },
      include: {
        classroom: {
          include: {
            owner: true,
          },
        },
      },
    });
  }
}
