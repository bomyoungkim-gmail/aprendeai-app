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
exports.ClassGradebookService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const json2csv_1 = require("json2csv");
let ClassGradebookService = class ClassGradebookService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getGradebook(classroomId) {
        const enrollments = await this.prisma.enrollments.findMany({
            where: { classroom_id: classroomId, status: "ACTIVE" },
            include: { users: true },
        });
        if (!enrollments.length)
            return { students: [], assignments: [] };
        const plans = await this.prisma.class_plan_weeks.findMany({
            where: { classroom_id: classroomId },
            orderBy: { week_start: "desc" },
        });
        const allContentIds = new Set();
        plans.forEach((p) => {
            const items = p.items_json;
            if (Array.isArray(items)) {
                items.forEach((id) => allContentIds.add(id));
            }
        });
        const contentIds = Array.from(allContentIds);
        const results = await this.prisma.game_results.findMany({
            where: {
                user_id: { in: enrollments.map((e) => e.learner_user_id) },
                content_id: { in: contentIds },
            },
        });
        const grid = enrollments.map((enrollment) => {
            const student = enrollment.users;
            const studentResults = results.filter((r) => r.user_id === student.id);
            const scores = {};
            studentResults.forEach((r) => {
                if (!scores[r.content_id] || r.score > scores[r.content_id]) {
                    scores[r.content_id] = r.score;
                }
            });
            return {
                studentId: student.id,
                name: student.name,
                email: student.email,
                scores,
            };
        });
        return {
            contentIds,
            data: grid,
        };
    }
    async exportGradebookCsv(classroomId) {
        const { contentIds, data } = await this.getGradebook(classroomId);
        if (data.length === 0)
            return "";
        const rows = data.map((row) => {
            const flatRow = {
                Name: row.name,
                Email: row.email,
                ID: row.studentId,
            };
            contentIds.forEach((cId) => {
                flatRow[cId] =
                    row.scores[cId] !== undefined ? row.scores[cId].toFixed(1) : "-";
            });
            return flatRow;
        });
        const fields = ["Name", "Email", "ID", ...contentIds];
        const parser = new json2csv_1.Parser({ fields });
        return parser.parse(rows);
    }
};
exports.ClassGradebookService = ClassGradebookService;
exports.ClassGradebookService = ClassGradebookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClassGradebookService);
//# sourceMappingURL=class-gradebook.service.js.map