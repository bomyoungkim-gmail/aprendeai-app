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
exports.PrismaCornellRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const cornell_note_entity_1 = require("../../domain/entities/cornell-note.entity");
let PrismaCornellRepository = class PrismaCornellRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByContentAndUser(contentId, userId) {
        const found = await this.prisma.cornell_notes.findUnique({
            where: {
                content_id_user_id: { content_id: contentId, user_id: userId },
            },
        });
        return found ? this.mapToDomain(found) : null;
    }
    async create(note) {
        const created = await this.prisma.cornell_notes.create({
            data: {
                id: note.id,
                content_id: note.contentId,
                user_id: note.userId,
                cues_json: note.cues || [],
                notes_json: note.notes || [],
                summary_text: note.summary || "",
            },
        });
        return this.mapToDomain(created);
    }
    async update(note) {
        var _a, _b, _c;
        const updated = await this.prisma.cornell_notes.update({
            where: { id: note.id },
            data: {
                cues_json: (_a = note.cues) !== null && _a !== void 0 ? _a : undefined,
                notes_json: (_b = note.notes) !== null && _b !== void 0 ? _b : undefined,
                summary_text: (_c = note.summary) !== null && _c !== void 0 ? _c : undefined,
                updated_at: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }
    mapToDomain(prismaNote) {
        return new cornell_note_entity_1.CornellNote({
            id: prismaNote.id,
            contentId: prismaNote.content_id,
            userId: prismaNote.user_id,
            cues: prismaNote.cues_json,
            notes: prismaNote.notes_json,
            summary: prismaNote.summary_text,
            createdAt: prismaNote.created_at,
            updatedAt: prismaNote.updated_at,
        });
    }
};
exports.PrismaCornellRepository = PrismaCornellRepository;
exports.PrismaCornellRepository = PrismaCornellRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCornellRepository);
//# sourceMappingURL=prisma-cornell.repository.js.map