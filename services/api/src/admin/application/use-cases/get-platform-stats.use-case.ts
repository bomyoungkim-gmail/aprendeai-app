import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class GetPlatformStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const [
      totalUsers,
      totalInstitutions,
      totalFamilies,
      totalContent,
      activeUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.institutions.count(),
      this.prisma.families.count(),
      this.prisma.contents.count(),
      this.prisma.users.count({
        where: {
          last_login_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.users.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalInstitutions,
      totalFamilies,
      totalContent,
      activeUsersThisWeek,
      newUsersThisMonth,
    };
  }
}
