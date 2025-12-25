import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class EmailWorker {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReports() {
    this.logger.log("Starting weekly report generation...");

    // tailored for families
    const families = await this.prisma.family.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const family of families) {
      const parents = family.members.filter(
        (m) => m.role === "GUARDIAN" || m.role === "OWNER",
      );
      const students = family.members.filter((m) => m.role === "CHILD");

      for (const parent of parents) {
        // In a real implementation we would aggregate stats here
        // For now we just log/simulate sending
        this.logger.log(
          `Sending weekly report for family ${family.name} to ${parent.user.email}`,
        );

        // await this.emailService.sendWeeklyReport(parent.user.email, { ...stats });
      }
    }

    this.logger.log("Weekly report generation complete.");
  }
}
