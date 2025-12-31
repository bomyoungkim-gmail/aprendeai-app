import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as csvParser from "csv-parser";
import { Readable } from "stream";
import { randomUUID } from "crypto";

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
              let user = await this.prisma.users.findUnique({
                where: { email },
              });

              if (!user) {
                user = await this.prisma.users.create({
                  data: {
                    id: randomUUID(),
                    email,
                    name: row.name || email.split("@")[0],
                    password_hash: "PENDING_INVITE",
                    schooling_level: "UNDERGRADUATE",
                    updated_at: new Date(),
                  },
                });
              }

              // Create institution member
              await this.prisma.institution_members.create({
                data: {
                  id: randomUUID(),
                  institution_id: institutionId,
                  user_id: user.id,
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
          const member = await this.prisma.institution_members.findFirst({
            where: {
              institution_id: institutionId,
              user_id: userId,
            },
          });
          if (member) {
            await this.prisma.institution_members.update({
              where: { id: member.id },
              data: { status: "ACTIVE" },
            });
          }
        } else {
          const member = await this.prisma.institution_members.findFirst({
            where: {
              institution_id: institutionId,
              user_id: userId,
            },
          });
          if (member) {
            await this.prisma.institution_members.delete({
              where: { id: member.id },
            });
          }
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
    const members = await this.prisma.institution_members.findMany({
      where: { institution_id: institutionId },
      include: { users: { select: { id: true, email: true, name: true } } },
    });

    const csvRows = [
      "Email,Name,Role,Status,Joined",
      ...members.map(
        (m) =>
          `${m.users.email},${m.users.name},${m.role},${m.status},${m.joined_at.toISOString()}`,
      ),
    ];

    return csvRows.join("\n");
  }
}
