"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const csvParser = require("csv-parser");
const stream_1 = require("stream");
const crypto_1 = require("crypto");
let BulkService = class BulkService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async bulkInviteFromCSV(institutionId, csvBuffer) {
        const results = [];
        const errors = [];
        let success = 0;
        let failed = 0;
        return new Promise((resolve) => {
            const stream = stream_1.Readable.from(csvBuffer.toString());
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
                        let user = await this.prisma.users.findUnique({
                            where: { email },
                        });
                        if (!user) {
                            user = await this.prisma.users.create({
                                data: {
                                    id: (0, crypto_1.randomUUID)(),
                                    email,
                                    name: row.name || email.split("@")[0],
                                    password_hash: "PENDING_INVITE",
                                    schooling_level: "UNDERGRADUATE",
                                    updated_at: new Date(),
                                },
                            });
                        }
                        await this.prisma.institution_members.create({
                            data: {
                                id: (0, crypto_1.randomUUID)(),
                                institution_id: institutionId,
                                user_id: user.id,
                                role: role,
                                status: "ACTIVE",
                            },
                        });
                        success++;
                    }
                    catch (error) {
                        errors.push(`${row.email}: ${error.message}`);
                        failed++;
                    }
                }
                resolve({ success, failed, errors });
            });
        });
    }
    async bulkApprovePending(institutionId, userIds, action) {
        const results = {
            success: 0,
            failed: 0,
            errors: [],
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
                }
                else {
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
            }
            catch (error) {
                results.failed++;
                results.errors.push(`${userId}: ${error.message}`);
            }
        }
        return results;
    }
    async exportMembersCSV(institutionId) {
        const members = await this.prisma.institution_members.findMany({
            where: { institution_id: institutionId },
            include: { users: { select: { id: true, email: true, name: true } } },
        });
        const csvRows = [
            "Email,Name,Role,Status,Joined",
            ...members.map((m) => `${m.users.email},${m.users.name},${m.role},${m.status},${m.joined_at.toISOString()}`),
        ];
        return csvRows.join("\n");
    }
};
exports.BulkService = BulkService;
exports.BulkService = BulkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BulkService);
//# sourceMappingURL=bulk.service.js.map