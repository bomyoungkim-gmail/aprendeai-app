import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  GetThreadsQuery,
  CreateCommentRequest,
  ShareContextType,
  CommentTargetType,
  SharePermission,
  AnnotationShareMode,
} from "./dto/sharing.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ThreadsService {
  constructor(private prisma: PrismaService) {}

  async getThread(dto: GetThreadsQuery) {
    // Lazy create logic
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
      // Create it
      thread = (await this.prisma.comment_threads.create({
        data: {
          id: uuidv4(),
          context_type: dto.contextType,
          context_id: dto.contextId,
          target_type: dto.targetType,
          target_id: dto.targetId,
        },
        include: { comments: true }, // Empty initially
      })) as any;
    }

    return thread;
  }

  async createComment(
    threadId: string,
    userId: string,
    dto: CreateCommentRequest,
  ) {
    const thread = await this.prisma.comment_threads.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundException("Thread not found");

    // Permission Checks
    await this.checkPermission(userId, thread);

    return this.prisma.comments.create({
      data: {
        id: uuidv4(),
        thread_id: threadId,
        author_id: userId,
        body: dto.body,
      },
      include: {
        author: { select: { id: true, name: true, avatar_url: true } },
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comments.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException("Comment not found");

    // Only author or admin/moderator? For MVP: Author only.
    if (comment.author_id !== userId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    return this.prisma.comments.update({
      where: { id: commentId },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    });
  }

  private async checkPermission(userId: string, thread: any) {
    const { context_type, context_id, target_type, target_id } = thread;

    // 1. Membership Check
    let isMember = false;
    if (context_type === ShareContextType.CLASSROOM) {
      // Check enrollment or Owner
      const enrollment = await this.prisma.enrollments.findUnique({
        where: {
          classroom_id_learner_user_id: {
            classroom_id: context_id,
            learner_user_id: userId,
          },
        },
      });
      if (enrollment && enrollment.status === "ACTIVE") isMember = true;

      const classroom = await this.prisma.classrooms.findUnique({
        where: { id: context_id },
      });
      if (classroom && classroom.owner_educator_id === userId) isMember = true;
    } else if (context_type === ShareContextType.FAMILY) {
      const member = await this.prisma.family_members.findUnique({
        where: {
          family_id_user_id: { family_id: context_id, user_id: userId },
        },
      });
      if (member) isMember = true;
    } else if (context_type === ShareContextType.STUDY_GROUP) {
      const member = await this.prisma.study_group_members.findFirst({
        where: { group_id: context_id, user_id: userId, status: "ACTIVE" },
      });
      if (member) isMember = true;
    }

    if (!isMember)
      throw new ForbiddenException("User is not a member of this context");

    // 2. Share Permission Check (Can Comment?)
    if (target_type === CommentTargetType.CONTENT) {
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
        throw new ForbiddenException("Content is not shared with this context");
      if (share.permission === SharePermission.VIEW)
        throw new ForbiddenException("Commenting not allowed (View only)");
    } else if (target_type === CommentTargetType.ANNOTATION) {
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
        throw new ForbiddenException(
          "Annotation is not shared with this context",
        );
      if (share.mode === AnnotationShareMode.VIEW)
        throw new ForbiddenException("Commenting not allowed (View only)");
    }
    // SUBMISSION permission implied by membership for now
  }
}
