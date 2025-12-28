// @ts-nocheck
// Note: ts-nocheck required due to Prisma Client type mismatches after db pull
// Runtime uses snake_case (institutions, contents) but types use camelCase (Institution, Content)
// Tests execute correctly despite TypeScript warnings

import { PrismaClient } from '@prisma/client';
import { TeacherVerificationStatus, ShareContextType, SharePermission, AnnotationShareMode, CommentTargetType } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

describe('Subfase 2.1: Foreign Key Constraints', () => {
  let testUser: any;
  let testInstitution: any;
  let testContent: any;
  let testAnnotation: any;

  beforeAll(async () => {
    // Create test data with explicit IDs (required after db pull)
    testInstitution = await prisma.institutions.create({
      data: {
        id: randomUUID(),
        name: 'Test Institution FK',
        type: 'SCHOOL',
        kind: 'EDUCATION',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    testUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: `fk-test-${Date.now()}@example.com`,
        name: 'FK Test User',
        role: 'TEACHER',
        schooling_level: 'HIGH_SCHOOL',
        institution_id: testInstitution.id,
        created_at: new Date(),
        updated_at: new Date(),
        status: 'ACTIVE',
      },
    });

    testContent = await prisma.contents.create({
      data: {
        id: randomUUID(),
        title: 'Test Content for FK',
        type: 'PDF',
        original_language: 'PT_BR',
        raw_text: 'Test content',
        created_by: testUser.id,
        owner_user_id: testUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    testAnnotation = await prisma.annotations.create({
      data: {
        id: randomUUID(),
        user_id: testUser.id,
        content_id: testContent.id,
        type: 'HIGHLIGHT',
        start_offset: 0,
        end_offset: 10,
        visibility: 'PRIVATE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.annotations.deleteMany({ where: { user_id: testUser.id } });
    await prisma.contents.deleteMany({ where: { created_by: testUser.id } });
    await prisma.users.deleteMany({ where: { email: { startsWith: 'fk-test-' } } });
    await prisma.institutions.deleteMany({ where: { name: 'Test Institution FK' } });
    await prisma.$disconnect();
  });

  describe('TeacherVerification Foreign Keys', () => {
    test('should create teacher verification with FK to User', async () => {
      const verification = await prisma.teacher_verifications.create({
        data: {
          id: randomUUID(),
          user_id: testUser.id,
          institution_id: testInstitution.id,
          status: TeacherVerificationStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(verification).toBeDefined();
      expect(verification.user_id).toBe(testUser.id);
      expect(verification.institution_id).toBe(testInstitution.id);

      // Cleanup
      await prisma.teacher_verifications.delete({ where: { id: verification.id } });
    });

    test('should CASCADE delete teacher verification when User is deleted', async () => {
      // Create temporary user with verification
      const tempUser = await prisma.users.create({
        data: {
          id: randomUUID(),
          email: `temp-fk-${Date.now()}@example.com`,
          name: 'Temp User',
          role: 'TEACHER',
          schooling_level: 'HIGH_SCHOOL',
          created_at: new Date(),
          updated_at: new Date(),
          status: 'ACTIVE',
        },
      });

      const verification = await prisma.teacher_verifications.create({
        data: {
          id: randomUUID(),
          user_id: tempUser.id,
          institution_id: testInstitution.id,
          status: TeacherVerificationStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Delete user
      await prisma.users.delete({ where: { id: tempUser.id } });

      // Verification should be CASCADE deleted
      const deletedVerification = await prisma.teacher_verifications.findUnique({
        where: { id: verification.id },
      });

      expect(deletedVerification).toBeNull();
    });

    test('should CASCADE delete teacher verification when Institution is deleted', async () => {
      // Create temporary institution with verification
      const tempInstitution = await prisma.institutions.create({
        data: {
          id: randomUUID(),
          name: 'Temp Institution',
          type: 'SCHOOL',
          kind: 'EDUCATION',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      const verification = await prisma.teacher_verifications.create({
        data: {
          id: randomUUID(),
          user_id: testUser.id,
          institution_id: tempInstitution.id,
          status: TeacherVerificationStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Delete institution
      await prisma.institutions.delete({ where: { id: tempInstitution.id } });

      // Verification should be CASCADE deleted
      const deletedVerification = await prisma.teacher_verifications.findUnique({
        where: { id: verification.id },
      });

      expect(deletedVerification).toBeNull();
    });

    test('should enforce unique constraint on user_id', async () => {
      // First verification
      const firstVerif = await prisma.teacher_verifications.create({
        data: {
          id: randomUUID(),
          user_id: testUser.id,
          institution_id: testInstitution.id,
          status: TeacherVerificationStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Second verification for same user (should fail)
      await expect(
        prisma.teacher_verifications.create({
          data: {
            id: randomUUID(),
            user_id: testUser.id,
            institution_id: testInstitution.id,
            status: TeacherVerificationStatus.VERIFIED,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.teacher_verifications.delete({ where: { id: firstVerif.id } });
    });
  });

  describe('ContentShare Foreign Keys', () => {
    test('should create content share with FK to Content', async () => {
      const share = await prisma.content_shares.create({
        data: {
          content_id: testContent.id,
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-123',
          permission: SharePermission.VIEW,
          created_at: new Date(),
        },
      });

      expect(share).toBeDefined();
      expect(share.content_id).toBe(testContent.id);

      // Cleanup
      await prisma.content_shares.deleteMany({
        where: {
          content_id: testContent.id,
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-123',
        },
      });
    });

    test('should CASCADE delete content share when Content is deleted', async () => {
      // Create temporary content with share
      const tempContent = await prisma.contents.create({
        data: {
          id: randomUUID(),
          title: 'Temp Content',
          type: 'PDF',
          original_language: 'PT_BR',
          raw_text: 'Temp',
          created_by: testUser.id,
          owner_user_id: testUser.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      const share = await prisma.content_shares.create({
        data: {
          content_id: tempContent.id,
          context_type: ShareContextType.FAMILY,
          context_id: 'family-123',
          permission: SharePermission.COMMENT,
          created_at: new Date(),
        },
      });

      // Delete content
      await prisma.contents.delete({ where: { id: tempContent.id } });

      // Share should be CASCADE deleted
      const deletedShare = await prisma.content_shares.findFirst({
        where: {
          content_id: tempContent.id,
          context_type: ShareContextType.FAMILY,
          context_id: 'family-123',
        },
      });

      expect(deletedShare).toBeNull();
    });

    test('should enforce composite PK on (content_id, context_type, context_id)', async () => {
      // First share
      await prisma.content_shares.create({
        data: {
          content_id: testContent.id,
          context_type: ShareContextType.STUDY_GROUP,
          context_id: 'group-123',
          permission: SharePermission.VIEW,
          created_at: new Date(),
        },
      });

      // Duplicate share (should fail)
      await expect(
        prisma.content_shares.create({
          data: {
            content_id: testContent.id,
            context_type: ShareContextType.STUDY_GROUP,
            context_id: 'group-123',
            permission: SharePermission.ASSIGN,
            created_at: new Date(),
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.content_shares.deleteMany({
        where: {
          content_id: testContent.id,
          context_type: ShareContextType.STUDY_GROUP,
          context_id: 'group-123',
        },
      });
    });
  });

  describe('AnnotationShare Foreign Keys', () => {
    test('should create annotation share with FK to Annotation', async () => {
      const share = await prisma.annotation_shares.create({
        data: {
          annotation_id: testAnnotation.id,
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-456',
          mode: AnnotationShareMode.VIEW,
          created_at: new Date(),
        },
      });

      expect(share).toBeDefined();
      expect(share.annotation_id).toBe(testAnnotation.id);

      // Cleanup
      await prisma.annotation_shares.deleteMany({
        where: {
          annotation_id: testAnnotation.id,
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-456',
        },
      });
    });

    test('should CASCADE delete annotation share when Annotation is deleted', async () => {
      // Create temporary annotation with share
      const tempAnnotation = await prisma.annotations.create({
        data: {
          id: randomUUID(),
          user_id: testUser.id,
          content_id: testContent.id,
          type: 'NOTE',
          start_offset: 20,
          end_offset: 40,
          visibility: 'PRIVATE',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      const share = await prisma.annotation_shares.create({
        data: {
          annotation_id: tempAnnotation.id,
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-789',
          mode: AnnotationShareMode.COMMENT,
          created_at: new Date(),
        },
      });

      // Delete annotation
      await prisma.annotations.delete({ where: { id: tempAnnotation.id } });

      // Share should be CASCADE deleted
      const deletedShare = await prisma.annotation_shares.findFirst({
        where: {
          annotation_id: tempAnnotation.id,
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-789',
        },
      });

      expect(deletedShare).toBeNull();
    });
  });

  describe('Comment Foreign Keys', () => {
    test('should create comment with FK to User (author)', async () => {
      // Create comment thread first
      const thread = await prisma.comment_threads.create({
        data: {
          id: randomUUID(),
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-abc',
          target_type: CommentTargetType.CONTENT,
          target_id: testContent.id,
          created_at: new Date(),
        },
      });

      const comment = await prisma.comments.create({
        data: {
          id: randomUUID(),
          thread_id: thread.id,
          author_id: testUser.id,
          body: 'Test comment',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(comment).toBeDefined();
      expect(comment.author_id).toBe(testUser.id);

      // Cleanup
      await prisma.comments.delete({ where: { id: comment.id } });
      await prisma.comment_threads.delete({ where: { id: thread.id } });
    });

    test('should CASCADE delete comment when User (author) is deleted', async () => {
      // Create temporary user with comment
      const tempUser = await prisma.users.create({
        data: {
          id: randomUUID(),
          email: `temp-comment-${Date.now()}@example.com`,
          name: 'Temp Comment User',
          role: 'STUDENT',
          schooling_level: 'MIDDLE_SCHOOL',
          created_at: new Date(),
          updated_at: new Date(),
          status: 'ACTIVE',
        },
      });

      const thread = await prisma.comment_threads.create({
        data: {
          id: randomUUID(),
          context_type: ShareContextType.CLASSROOM,
          context_id: 'classroom-def',
          target_type: CommentTargetType.CONTENT,
          target_id: testContent.id,
          created_at: new Date(),
        },
      });

      const comment = await prisma.comments.create({
        data: {
          id: randomUUID(),
          thread_id: thread.id,
          author_id: tempUser.id,
          body: 'Temp comment',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Delete user
      await prisma.users.delete({ where: { id: tempUser.id } });

      // Comment should be CASCADE deleted
      const deletedComment = await prisma.comments.findUnique({
        where: { id: comment.id },
      });

      expect(deletedComment).toBeNull();

      // Cleanup thread
      await prisma.comment_threads.delete({ where: { id: thread.id } });
    });

    test('should CASCADE delete comment when CommentThread is deleted', async () => {
      const thread = await prisma.comment_threads.create({
        data: {
          id: randomUUID(),
          context_type: ShareContextType.STUDY_GROUP,
          context_id: 'group-xyz',
          target_type: CommentTargetType.ANNOTATION,
          target_id: testAnnotation.id,
          created_at: new Date(),
        },
      });

      const comment = await prisma.comments.create({
        data: {
          id: randomUUID(),
          thread_id: thread.id,
          author_id: testUser.id,
          body: 'Thread comment',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Delete thread
      await prisma.comment_threads.delete({ where: { id: thread.id } });

      // Comment should be CASCADE deleted
      const deletedComment = await prisma.comments.findUnique({
        where: { id: comment.id },
      });

      expect(deletedComment).toBeNull();
    });
  });

  describe('InstitutionPolicy Foreign Keys', () => {
    test('should create institution policy with FK to Institution', async () => {
      const policy = await prisma.institution_policies.create({
        data: {
          id: randomUUID(),
          institution_id: testInstitution.id,
          allow_advanced_ai: true,
          allow_external_sharing: false,
          allow_text_extraction: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(policy).toBeDefined();
      expect(policy.institution_id).toBe(testInstitution.id);

      // Cleanup
      await prisma.institution_policies.delete({ where: { id: policy.id } });
    });

    test('should CASCADE delete policy when Institution is deleted', async () => {
      // Create temporary institution with policy
      const tempInstitution = await prisma.institutions.create({
        data: {
          id: randomUUID(),
          name: 'Temp Policy Institution',
          type: 'UNIVERSITY',
          kind: 'EDUCATION',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      const policy = await prisma.institution_policies.create({
        data: {
          id: randomUUID(),
          institution_id: tempInstitution.id,
          allow_advanced_ai: false,
          allow_external_sharing: true,
          allow_text_extraction: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Delete institution
      await prisma.institutions.delete({ where: { id: tempInstitution.id } });

      // Policy should be CASCADE deleted
      const deletedPolicy = await prisma.institution_policies.findUnique({
        where: { id: policy.id },
      });

      expect(deletedPolicy).toBeNull();
    });

    test('should enforce unique constraint on institution_id', async () => {
      // First policy
      const firstPolicy = await prisma.institution_policies.create({
        data: {
          id: randomUUID(),
          institution_id: testInstitution.id,
          allow_advanced_ai: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Second policy for same institution (should fail)
      await expect(
        prisma.institution_policies.create({
          data: {
            id: randomUUID(),
            institution_id: testInstitution.id,
            allow_advanced_ai: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.institution_policies.delete({ where: { id: firstPolicy.id } });
    });
  });
});
