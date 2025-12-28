import { PrismaClient } from '@prisma/client';
import { TeacherVerificationStatus, ShareContextType, SharePermission, AnnotationShareMode, CommentTargetType } from '@prisma/client';

const prisma = new PrismaClient();

describe('Subfase 2.1: Foreign Key Constraints', () => {
  let testUser: any;
  let testInstitution: any;
  let testContent: any;
  let testAnnotation: any;

  beforeAll(async () => {
    // Create test data
    testInstitution = await prisma.institution.create({
      data: {
        name: 'Test Institution FK',
        type: 'SCHOOL',
        kind: 'EDUCATION',
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: `fk-test-${Date.now()}@example.com`,
        name: 'FK Test User',
        role: 'TEACHER',
        schoolingLevel: 'HIGH_SCHOOL',
        institutionId: testInstitution.id,
      },
    });

    testContent = await prisma.content.create({
      data: {
        title: 'Test Content for FK',
        type: 'PDF',
        originalLanguage: 'PT_BR',
        rawText: 'Test content',
        createdBy: testUser.id,
        ownerUserId: testUser.id,
      },
    });

    testAnnotation = await prisma.annotation.create({
      data: {
        userId: testUser.id,
        contentId: testContent.id,
        type: 'HIGHLIGHT',
        startOffset: 0,
        endOffset: 10,
        visibility: 'PRIVATE',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.annotation.deleteMany({ where: { userId: testUser.id } });
    await prisma.content.deleteMany({ where: { createdBy: testUser.id } });
    await prisma.user.deleteMany({ where: { email:{startsWith: 'fk-test-'} } });
    await prisma.institution.deleteMany({ where: { name: 'Test Institution FK' } });
    await prisma.$disconnect();
  });

  describe('TeacherVerification Foreign Keys', () => {
    test('should create teacher verification with FK to User', async () => {
      const verification = await prisma.teacherVerification.create({
        data: {
          userId: testUser.id,
          institutionId: testInstitution.id,
          status: TeacherVerificationStatus.PENDING,
        },
      });

      expect(verification).toBeDefined();
      expect(verification.userId).toBe(testUser.id);
      expect(verification.institutionId).toBe(testInstitution.id);
    });

    test('should CASCADE delete teacher verification when User is deleted', async () => {
      // Create temporary user with verification
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-fk-${Date.now()}@example.com`,
          name: 'Temp User',
          role: 'TEACHER',
          schoolingLevel: 'HIGH_SCHOOL',
        },
      });

      const verification = await prisma.teacherVerification.create({
        data: {
          userId: tempUser.id,
          institutionId: testInstitution.id,
          status: TeacherVerificationStatus.PENDING,
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: tempUser.id } });

      // Verification should be CASCADE deleted
      const deletedVerification = await prisma.teacherVerification.findUnique({
        where: { id: verification.id },
      });

      expect(deletedVerification).toBeNull();
    });

    test('should CASCADE delete teacher verification when Institution is deleted', async () => {
      // Create temporary institution with verification
      const tempInstitution = await prisma.institution.create({
        data: {
          name: 'Temp Institution',
          type: 'SCHOOL',
          kind: 'EDUCATION',
        },
      });

      const verification = await prisma.teacherVerification.create({
        data: {
          userId: testUser.id,
          institutionId: tempInstitution.id,
          status: TeacherVerificationStatus.PENDING,
        },
      });

      // Delete institution
      await prisma.institution.delete({ where: { id: tempInstitution.id } });

      // Verification should be CASCADE deleted
      const deletedVerification = await prisma.teacherVerification.findUnique({
        where: { id: verification.id },
      });

      expect(deletedVerification).toBeNull();
    });

    test('should enforce unique constraint on userId', async () => {
      // First verification
      await prisma.teacherVerification.create({
        data: {
          userId: testUser.id,
          institutionId: testInstitution.id,
          status: TeacherVerificationStatus.PENDING,
        },
      });

      // Second verification for same user (should fail)
      await expect(
        prisma.teacherVerification.create({
          data: {
            userId: testUser.id,
            institutionId: testInstitution.id,
            status: TeacherVerificationStatus.VERIFIED,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('ContentShare Foreign Keys', () => {
    test('should create content share with FK to Content', async () => {
      const share = await prisma.contentShare.create({
        data: {
          contentId: testContent.id,
          contextType: ShareContextType.CLASSROOM,
          contextId: 'classroom-123',
          permission: SharePermission.VIEW,
        },
      });

      expect(share).toBeDefined();
      expect(share.contentId).toBe(testContent.id);
    });

    test('should CASCADE delete content share when Content is deleted', async () => {
      // Create temporary content with share
      const tempContent = await prisma.content.create({
        data: {
          title: 'Temp Content',
          type: 'PDF',
          originalLanguage: 'PT_BR',
          rawText: 'Temp',
          createdBy: testUser.id,
          ownerUserId: testUser.id,
        },
      });

      const share = await prisma.contentShare.create({
        data: {
          contentId: tempContent.id,
          contextType: ShareContextType.FAMILY,
          contextId: 'family-123',
          permission: SharePermission.COMMENT,
        },
      });

      // Delete content
      await prisma.content.delete({ where: { id: tempContent.id } });

      // Share should be CASCADE deleted
      const deletedShare = await prisma.contentShare.findFirst({
        where: {
          contentId: tempContent.id,
          contextType: ShareContextType.FAMILY,
          contextId: 'family-123',
        },
      });

      expect(deletedShare).toBeNull();
    });

    test('should enforce composite PK on (contentId, contextType, contextId)', async () => {
      // First share
      await prisma.contentShare.create({
        data: {
          contentId: testContent.id,
          contextType: ShareContextType.STUDY_GROUP,
          contextId: 'group-123',
          permission: SharePermission.VIEW,
        },
      });

      // Duplicate share (should fail)
      await expect(
        prisma.contentShare.create({
          data: {
            contentId: testContent.id,
            contextType: ShareContextType.STUDY_GROUP,
            contextId: 'group-123',
            permission: SharePermission.ASSIGN,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('AnnotationShare Foreign Keys', () => {
    test('should create annotation share with FK to Annotation', async () => {
      const share = await prisma.annotationShare.create({
        data: {
          annotationId: testAnnotation.id,
          contextType: ShareContextType.CLASSROOM,
          contextId: 'classroom-456',
          mode: AnnotationShareMode.VIEW,
        },
      });

      expect(share).toBeDefined();
      expect(share.annotationId).toBe(testAnnotation.id);
    });

    test('should CASCADE delete annotation share when Annotation is deleted', async () => {
      // Create temporary annotation with share
      const tempAnnotation = await prisma.annotation.create({
        data: {
          userId: testUser.id,
          contentId: testContent.id,
          type: 'NOTE',
          startOffset: 20,
          endOffset: 40,
          visibility: 'PRIVATE',
        },
      });

      const share = await prisma.annotationShare.create({
        data: {
          annotationId: tempAnnotation.id,
          contextType: ShareContextType.CLASSROOM,
          contextId: 'classroom-789',
          mode: AnnotationShareMode.COMMENT,
        },
      });

      // Delete annotation
      await prisma.annotation.delete({ where: { id: tempAnnotation.id } });

      // Share should be CASCADE deleted
      const deletedShare = await prisma.annotationShare.findFirst({
        where: {
          annotationId: tempAnnotation.id,
          contextType: ShareContextType.CLASSROOM,
          contextId: 'classroom-789',
        },
      });

      expect(deletedShare).toBeNull();
    });
  });

  describe('Comment Foreign Keys', () => {
    test('should create comment with FK to User (author)', async () => {
      // Create comment thread first
      const thread = await prisma.commentThread.create({
        data: {
          contextType: ShareContextType.CLASSROOM,
          contextId: 'classroom-abc',
          targetType: CommentTargetType.CONTENT,
          targetId: testContent.id,
        },
      });

      const comment = await prisma.comment.create({
        data: {
          threadId: thread.id,
          authorId: testUser.id,
          body: 'Test comment',
        },
      });

      expect(comment).toBeDefined();
      expect(comment.authorId).toBe(testUser.id);

      // Cleanup
      await prisma.comment.delete({ where: { id: comment.id } });
      await prisma.commentThread.delete({ where: { id: thread.id } });
    });

    test('should CASCADE delete comment when User (author) is deleted', async () => {
      // Create temporary user with comment
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-comment-${Date.now()}@example.com`,
          name: 'Temp Comment User',
          role: 'STUDENT',
          schoolingLevel: 'MIDDLE_SCHOOL',
        },
      });

      const thread = await prisma.commentThread.create({
        data: {
          contextType: ShareContextType.CLASSROOM,
          contextId: 'classroom-def',
          targetType: CommentTargetType.CONTENT,
          targetId: testContent.id,
        },
      });

      const comment = await prisma.comment.create({
        data: {
          threadId: thread.id,
          authorId: tempUser.id,
          body: 'Temp comment',
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: tempUser.id } });

      // Comment should be CASCADE deleted
      const deletedComment = await prisma.comment.findUnique({
        where: { id: comment.id },
      });

      expect(deletedComment).toBeNull();

      // Cleanup thread
      await prisma.commentThread.delete({ where: { id: thread.id } });
    });

    test('should CASCADE delete comment when CommentThread is deleted', async () => {
      const thread = await prisma.commentThread.create({
        data: {
          contextType: ShareContextType.STUDY_GROUP,
          contextId: 'group-xyz',
          targetType: CommentTargetType.ANNOTATION,
          targetId: testAnnotation.id,
        },
      });

      const comment = await prisma.comment.create({
        data: {
          threadId: thread.id,
          authorId: testUser.id,
          body: 'Thread comment',
        },
      });

      // Delete thread
      await prisma.commentThread.delete({ where: { id: thread.id } });

      // Comment should be CASCADE deleted
      const deletedComment = await prisma.comment.findUnique({
        where: { id: comment.id },
      });

      expect(deletedComment).toBeNull();
    });
  });

  describe('InstitutionPolicy Foreign Keys', () => {
    test('should create institution policy with FK to Institution', async () => {
      const policy = await prisma.institutionPolicy.create({
        data: {
          institutionId: testInstitution.id,
          allowAdvancedAI: true,
          allowExternalSharing: false,
          allowTextExtraction: true,
        },
      });

      expect(policy).toBeDefined();
      expect(policy.institutionId).toBe(testInstitution.id);
    });

    test('should CASCADE delete policy when Institution is deleted', async () => {
      // Create temporary institution with policy
      const tempInstitution = await prisma.institution.create({
        data: {
          name: 'Temp Policy Institution',
          type: 'UNIVERSITY',
          kind: 'EDUCATION',
        },
      });

      const policy = await prisma.institutionPolicy.create({
        data: {
          institutionId: tempInstitution.id,
          allowAdvancedAI: false,
          allowExternalSharing: true,
          allowTextExtraction: false,
        },
      });

      // Delete institution
      await prisma.institution.delete({ where: { id: tempInstitution.id } });

      // Policy should be CASCADE deleted
      const deletedPolicy = await prisma.institutionPolicy.findUnique({
        where: { id: policy.id },
      });

      expect(deletedPolicy).toBeNull();
    });

    test('should enforce unique constraint on institutionId', async () => {
      // First policy
      await prisma.institutionPolicy.create({
        data: {
          institutionId: testInstitution.id,
          allowAdvancedAI: true,
        },
      });

      // Second policy for same institution (should fail)
      await expect(
        prisma.institutionPolicy.create({
          data: {
            institutionId: testInstitution.id,
            allowAdvancedAI: false,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Inverse Relations Queries', () => {
    test('should query User with teacherVerification relation', async () => {
      await prisma.teacherVerification.create({
        data: {
          userId: testUser.id,
          institutionId: testInstitution.id,
          status: TeacherVerificationStatus.VERIFIED,
        },
      });

      const userWithVerification = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { teacherVerification: true },
      });

      expect(userWithVerification?.teacherVerification).toBeDefined();
      expect(userWithVerification?.teacherVerification?.status).toBe(TeacherVerificationStatus.VERIFIED);
    });

    test('should query Institution with teacherVerifications relation', async () => {
      const institutionWithVerifications = await prisma.institution.findUnique({
        where: { id: testInstitution.id },
        include: { teacherVerifications: true },
      });

      expect(institutionWithVerifications?.teacherVerifications).toBeDefined();
      expect(Array.isArray(institutionWithVerifications?.teacherVerifications)).toBe(true);
    });

    test('should query Content with shares relation', async () => {
      await prisma.contentShare.create({
        data: {
          contentId: testContent.id,
          contextType: ShareContextType.CLASSROOM,
          contextId: 'classroom-rel',
          permission: SharePermission.VIEW,
        },
      });

      const contentWithShares = await prisma.content.findUnique({
        where: { id: testContent.id },
        include: { shares: true },
      });

      expect(contentWithShares?.shares).toBeDefined();
      expect(Array.isArray(contentWithShares?.shares)).toBe(true);
      expect(contentWithShares?.shares.length).toBeGreaterThan(0);
    });

    test('should query Annotation with shares relation', async () => {
      await prisma.annotationShare.create({
        data: {
          annotationId: testAnnotation.id,
          contextType: ShareContextType.STUDY_GROUP,
          contextId: 'group-rel',
          mode: AnnotationShareMode.VIEW,
        },
      });

      const annotationWithShares = await prisma.annotation.findUnique({
        where: { id: testAnnotation.id },
        include: { shares: true },
      });

      expect(annotationWithShares?.shares).toBeDefined();
      expect(Array.isArray(annotationWithShares?.shares)).toBe(true);
      expect(annotationWithShares?.shares.length).toBeGreaterThan(0);
    });
  });
});
