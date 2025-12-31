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
exports.ThreadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sharing_dto_1 = require("./dto/sharing.dto");
const uuid_1 = require("uuid");
let ThreadsService = class ThreadsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getThread(dto) {
        let thread = await this.prisma.comment_threads.findUnique({
            where: {
                context_type_context_id_target_type_target_id: {
                    context_type: dto.contextType,
                    context_id: dto.contextId,
                    target_type: dto.targetType,
                    target_id: dto.targetId,
                },
            },
            include: {
                comments: {
                    where: { deleted_at: null },
                    include: {
                        author: { select: { id: true, name: true, avatar_url: true } },
                    },
                    orderBy: { created_at: "asc" },
                },
            },
        });
        if (!thread) {
            thread = (await this.prisma.comment_threads.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    context_type: dto.contextType,
                    context_id: dto.contextId,
                    target_type: dto.targetType,
                    target_id: dto.targetId,
                },
                include: { comments: true },
            }));
        }
        return thread;
    }
    async createComment(threadId, userId, dto) {
        const thread = await this.prisma.comment_threads.findUnique({
            where: { id: threadId },
        });
        if (!thread)
            throw new common_1.NotFoundException("Thread not found");
        await this.checkPermission(userId, thread);
        return this.prisma.comments.create({
            data: {
                id: (0, uuid_1.v4)(),
                thread_id: threadId,
                author_id: userId,
                body: dto.body,
            },
            include: {
                author: { select: { id: true, name: true, avatar_url: true } },
            },
        });
    }
    async deleteComment(commentId, userId) {
        const comment = await this.prisma.comments.findUnique({
            where: { id: commentId },
        });
        if (!comment)
            throw new common_1.NotFoundException("Comment not found");
        if (comment.author_id !== userId) {
            throw new common_1.ForbiddenException("You can only delete your own comments");
        }
        return this.prisma.comments.update({
            where: { id: commentId },
            data: {
                deleted_at: new Date(),
                deleted_by: userId,
            },
        });
    }
    async checkPermission(userId, thread) {
        const { context_type, context_id, target_type, target_id } = thread;
        let isMember = false;
        if (context_type === sharing_dto_1.ShareContextType.CLASSROOM) {
            const enrollment = await this.prisma.enrollments.findUnique({
                where: {
                    classroom_id_learner_user_id: {
                        classroom_id: context_id,
                        learner_user_id: userId,
                    },
                },
            });
            if (enrollment && enrollment.status === "ACTIVE")
                isMember = true;
            const classroom = await this.prisma.classrooms.findUnique({
                where: { id: context_id },
            });
            if (classroom && classroom.owner_educator_id === userId)
                isMember = true;
        }
        else if (context_type === sharing_dto_1.ShareContextType.FAMILY) {
            const member = await this.prisma.family_members.findUnique({
                where: {
                    family_id_user_id: { family_id: context_id, user_id: userId },
                },
            });
            if (member)
                isMember = true;
        }
        else if (context_type === sharing_dto_1.ShareContextType.STUDY_GROUP) {
            const member = await this.prisma.study_group_members.findFirst({
                where: { group_id: context_id, user_id: userId, status: "ACTIVE" },
            });
            if (member)
                isMember = true;
        }
        if (!isMember)
            throw new common_1.ForbiddenException("User is not a member of this context");
        if (target_type === sharing_dto_1.CommentTargetType.CONTENT) {
            const share = await this.prisma.content_shares.findUnique({
                where: {
                    content_id_context_type_context_id: {
                        content_id: target_id,
                        context_type,
                        context_id,
                    },
                },
            });
            if (!share)
                throw new common_1.ForbiddenException("Content is not shared with this context");
            if (share.permission === sharing_dto_1.SharePermission.VIEW)
                throw new common_1.ForbiddenException("Commenting not allowed (View only)");
        }
        else if (target_type === sharing_dto_1.CommentTargetType.ANNOTATION) {
            const share = await this.prisma.annotation_shares.findUnique({
                where: {
                    annotation_id_context_type_context_id: {
                        annotation_id: target_id,
                        context_type,
                        context_id,
                    },
                },
            });
            if (!share)
                throw new common_1.ForbiddenException("Annotation is not shared with this context");
            if (share.mode === sharing_dto_1.AnnotationShareMode.VIEW)
                throw new common_1.ForbiddenException("Commenting not allowed (View only)");
        }
    }
};
exports.ThreadsService = ThreadsService;
exports.ThreadsService = ThreadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ThreadsService);
//# sourceMappingURL=threads.service.js.map