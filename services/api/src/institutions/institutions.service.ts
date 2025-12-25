import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
} from "./dto/institution.dto";

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  create(createInstitutionDto: CreateInstitutionDto) {
    return this.prisma.institution.create({
      data: createInstitutionDto,
    });
  }

  findAll() {
    return this.prisma.institution.findMany();
  }

  findOne(id: string) {
    return this.prisma.institution.findUnique({
      where: { id },
      include: { classes: true },
    });
  }

  update(id: string, updateInstitutionDto: UpdateInstitutionDto) {
    return this.prisma.institution.update({
      where: { id },
      data: updateInstitutionDto,
    });
  }

  remove(id: string) {
    return this.prisma.institution.delete({
      where: { id },
    });
  }

  async getInstitutionForAdmin(userId: string) {
    // Find the institution where this user is an INSTITUTION_ADMIN
    const institutionMember = await this.prisma.institutionMember.findFirst({
      where: {
        userId,
        role: "INSTITUTION_ADMIN",
        status: "ACTIVE",
      },
      include: {
        institution: true,
      },
    });

    if (!institutionMember) {
      throw new Error("User is not an institution admin");
    }

    const institutionId = institutionMember.institutionId;

    // Aggregate stats
    const [memberCount, activeInvites, pendingApprovals, domains] =
      await Promise.all([
        this.prisma.institutionMember.count({
          where: { institutionId, status: "ACTIVE" },
        }),
        this.prisma.institutionInvite.count({
          where: { institutionId, usedAt: null, expiresAt: { gt: new Date() } },
        }),
        this.prisma.pendingUserApproval.count({
          where: { institutionId, status: "PENDING" },
        }),
        this.prisma.institutionDomain.findMany({
          where: { institutionId },
          select: { domain: true },
        }),
      ]);

    return {
      ...institutionMember.institution,
      memberCount,
      activeInvites,
      pendingApprovals,
      domains: domains.map((d) => d.domain),
    };
  }
}
