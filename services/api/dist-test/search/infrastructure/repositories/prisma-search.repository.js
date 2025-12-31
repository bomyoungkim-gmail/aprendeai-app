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
exports.PrismaSearchRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PrismaSearchRepository = class PrismaSearchRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchContent(query, filters) {
        const where = {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { raw_text: { contains: query, mode: 'insensitive' } },
            ],
        };
        if (filters.contentType)
            where.type = filters.contentType;
        if (filters.language)
            where.original_language = filters.language;
        if (filters.ownerId)
            where.owner_user_id = filters.ownerId;
        if (filters.startDate || filters.endDate) {
            where.created_at = {};
            if (filters.startDate)
                where.created_at.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.created_at.lte = new Date(filters.endDate);
        }
        const contents = await this.prisma.contents.findMany({
            where,
            include: {
                users_owner: { select: { id: true, name: true } },
            },
            take: 50,
        });
        return contents.map((content) => ({
            id: content.id,
            type: 'content',
            title: content.title,
            snippet: this.extractSnippet(content.raw_text, query, 150),
            relevance: this.calculateRelevance(content.title, content.raw_text, query),
            metadata: {
                type: content.type,
                language: content.original_language,
                owner: content.users_owner,
            },
            created_at: content.created_at,
        }));
    }
    async searchTranscripts(query) {
        const contents = await this.prisma.contents.findMany({
            where: {
                type: { in: ['VIDEO', 'AUDIO'] },
                metadata: {
                    path: ['transcription', 'text'],
                    string_contains: query,
                },
            },
            include: {
                users_owner: { select: { id: true, name: true } },
            },
            take: 50,
        });
        return contents.map((content) => {
            var _a, _b;
            const transcription = ((_b = (_a = content.metadata) === null || _a === void 0 ? void 0 : _a.transcription) === null || _b === void 0 ? void 0 : _b.text) || '';
            return {
                id: content.id,
                type: 'transcript',
                title: `${content.title} (Transcript)`,
                snippet: this.extractSnippet(transcription, query, 150),
                relevance: this.calculateRelevance('', transcription, query),
                metadata: {
                    type: content.type,
                    owner: content.users_owner,
                },
                created_at: content.created_at,
            };
        });
    }
    async searchAnnotations(userId, query) {
        const annotations = await this.prisma.annotations.findMany({
            where: {
                user_id: userId,
                OR: [
                    { text: { contains: query, mode: 'insensitive' } },
                    { selected_text: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: {
                contents: { select: { id: true, title: true } },
                users: { select: { id: true, name: true } },
            },
            take: 50,
        });
        return annotations.map((annotation) => ({
            id: annotation.id,
            type: 'annotation',
            title: `Annotation on ${annotation.contents.title}`,
            snippet: this.extractSnippet(annotation.text || annotation.selected_text || '', query, 150),
            relevance: this.calculateRelevance('', annotation.text || annotation.selected_text || '', query),
            metadata: {
                contentId: annotation.contents.id,
                contentTitle: annotation.contents.title,
                user: annotation.users,
            },
            created_at: annotation.created_at,
        }));
    }
    async searchNotes(userId, query) {
        const notes = await this.prisma.cornell_notes.findMany({
            where: {
                user_id: userId,
                OR: [
                    { summary_text: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: {
                contents: { select: { id: true, title: true } },
                users: { select: { id: true, name: true } },
            },
            take: 50,
        });
        return notes.map((note) => {
            const combinedText = `${note.summary_text}`;
            return {
                id: note.id,
                type: 'note',
                title: `Cornell Note on ${note.contents.title}`,
                snippet: this.extractSnippet(combinedText, query, 150),
                relevance: this.calculateRelevance('', combinedText, query),
                metadata: {
                    contentId: note.contents.id,
                    contentTitle: note.contents.title,
                    user: note.users,
                },
                created_at: note.created_at,
            };
        });
    }
    extractSnippet(text, query, length) {
        if (!text)
            return '';
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const queryIndex = lowerText.indexOf(lowerQuery);
        if (queryIndex === -1) {
            return text.substring(0, length) + (text.length > length ? '...' : '');
        }
        const start = Math.max(0, queryIndex - length / 3);
        const end = Math.min(text.length, queryIndex + query.length + (length * 2) / 3);
        let snippet = text.substring(start, end);
        if (start > 0)
            snippet = '...' + snippet;
        if (end < text.length)
            snippet = snippet + '...';
        return snippet;
    }
    calculateRelevance(title, content, query) {
        const lowerQuery = query.toLowerCase();
        const lowerTitle = title.toLowerCase();
        const lowerContent = content.toLowerCase();
        let score = 0;
        if (lowerTitle.includes(lowerQuery)) {
            score += 10;
            if (lowerTitle === lowerQuery)
                score += 20;
        }
        if (lowerContent.includes(lowerQuery)) {
            score += 5;
            const matches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
            score += Math.min(matches, 5);
        }
        return score;
    }
};
exports.PrismaSearchRepository = PrismaSearchRepository;
exports.PrismaSearchRepository = PrismaSearchRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSearchRepository);
//# sourceMappingURL=prisma-search.repository.js.map