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
exports.AnnotationExportService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = require("pdfkit");
const prisma_service_1 = require("../prisma/prisma.service");
let AnnotationExportService = class AnnotationExportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportToPDF(userId) {
        const annotations = await this.getAnnotationsForExport(userId);
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const buffers = [];
            doc.on("data", (buffer) => buffers.push(buffer));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", reject);
            doc
                .fontSize(24)
                .font("Helvetica-Bold")
                .text("My Annotations", { align: "center" });
            doc.moveDown();
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(`Exported on ${new Date().toLocaleDateString()}`, {
                align: "center",
            });
            doc.moveDown(2);
            const grouped = this.groupByContent(annotations);
            Object.entries(grouped).forEach(([contentTitle, annots]) => {
                doc
                    .fontSize(16)
                    .font("Helvetica-Bold")
                    .fillColor("#333")
                    .text(contentTitle);
                doc.moveDown(0.5);
                annots.forEach((annotation, index) => {
                    doc
                        .fontSize(10)
                        .font("Helvetica")
                        .fillColor("#666")
                        .text(`${index + 1}. ${new Date(annotation.created_at).toLocaleDateString()}`);
                    if (annotation.selected_text) {
                        doc
                            .fontSize(11)
                            .font("Helvetica-Oblique")
                            .fillColor("#444")
                            .text(`"${annotation.selected_text}"`, { indent: 20 });
                    }
                    if (annotation.text) {
                        doc
                            .fontSize(10)
                            .font("Helvetica")
                            .fillColor("#000")
                            .text(annotation.text, { indent: 20 });
                    }
                    doc.moveDown(0.5);
                });
                doc.moveDown();
            });
            doc.end();
        });
    }
    async exportToMarkdown(userId) {
        const annotations = await this.getAnnotationsForExport(userId);
        let markdown = "# My Annotations\n\n";
        markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
        markdown += "---\n\n";
        const grouped = this.groupByContent(annotations);
        Object.entries(grouped).forEach(([contentTitle, annots]) => {
            markdown += `## ${contentTitle}\n\n`;
            annots.forEach((annotation, index) => {
                markdown += `### ${index + 1}. ${new Date(annotation.created_at).toLocaleDateString()}\n\n`;
                if (annotation.selected_text) {
                    markdown += `> ${annotation.selected_text}\n\n`;
                }
                if (annotation.text) {
                    markdown += `**Note:** ${annotation.text}\n\n`;
                }
                if (annotation.color) {
                    markdown += `*Color: ${annotation.color}*\n\n`;
                }
                markdown += "---\n\n";
            });
        });
        return markdown;
    }
    async getAnnotationsForExport(userId) {
        return this.prisma.annotations.findMany({
            where: { user_id: userId },
            include: {
                contents: {
                    select: { title: true },
                },
                users: {
                    select: { name: true },
                },
            },
            orderBy: [{ contents: { title: "asc" } }, { created_at: "asc" }],
        });
    }
    groupByContent(annotations) {
        return annotations.reduce((acc, annotation) => {
            const title = annotation.contents.title;
            if (!acc[title]) {
                acc[title] = [];
            }
            acc[title].push(annotation);
            return acc;
        }, {});
    }
};
exports.AnnotationExportService = AnnotationExportService;
exports.AnnotationExportService = AnnotationExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnnotationExportService);
//# sourceMappingURL=annotation-export.service.js.map