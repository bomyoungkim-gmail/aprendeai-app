import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as csvParser from "csv-parser";
import { Readable } from "stream";

@Injectable()
export class BulkService {
  constructor(private prisma: PrismaService) {}

  /**
   * Bulk invite members from CSV
   */
  async bulkInviteFromCSV(
    institutionId: string,
    csvBuffer: Buffer,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results: any[] = [];
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    return new Promise((resolve) => {
      const stream = Readable.from(csvBuffer.toString());

      stream
        .pipe(csvParser())
        .on("data", (row) => results.push(row))
        .on("end", async () => {
          for (const row of results) {
            try {
              const { email, role = "STUDENT" } = row;

              if (!email) {
                errors.push("Missing email");
                failed++;
                continue;
              }

              // Create or find user
              let user = await this.prisma.user.findUnique({
                where: { email },
              });

              if (!user) {
                user = await this.prisma.user.create({
                  data: {
                    email,
                    name: row.name || email.split("@")[0],
                    passwordHash: "PENDING_INVITE",
                    role: "COMMON_USER",
                    schoolingLevel: "UNDERGRADUATE",
                  },
                });
              }

              // Create institution member
              await this.prisma.institutionMember.create({
                data: {
                  institutionId,
                  userId: user.id,
                  role: role as any,
                  status: "ACTIVE" as any,
                },
              });

              success++;
            } catch (error) {
              errors.push(`${row.email}: ${error.message}`);
              failed++;
            }
          }

          resolve({ success, failed, errors });
        });
    });
  }

  /**
   * Bulk approve/reject pending users
   */
  async bulkApprovePending(
    institutionId: string,
    userIds: string[],
    action: "approve" | "reject",
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const userId of userIds) {
      try {
        if (action === "approve") {
          await this.prisma.institutionMember.update({
            where: {
              institutionId_userId: { institutionId, userId },
            },
            data: { status: "ACTIVE" },
          });
        } else {
          await this.prisma.institutionMember.delete({
            where: {
              institutionId_userId: { institutionId, userId },
            },
          });
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${userId}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Export institution members as CSV
   */
  async exportMembersCSV(institutionId: string): Promise<string> {
    const members = await this.prisma.institutionMember.findMany({
      where: { institutionId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    const csvRows = [
      "Email,Name,Role,Status,Joined",
      ...members.map(
        (m) =>
          `${m.user.email},${m.user.name},${m.role},${m.status},${m.joinedAt.toISOString()}`,
      ),
    ];

    return csvRows.join("\n");
  }
}
