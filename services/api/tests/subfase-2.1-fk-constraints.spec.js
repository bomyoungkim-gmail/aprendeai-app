"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
describe("Subfase 2.1: Foreign Key Constraints", () => {
    let testUser;
    let testInstitution;
    let testContent;
    let testAnnotation;
    beforeAll(async () => {
        testInstitution = await prisma.institutions.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                name: "Test Institution FK",
                type: "SCHOOL",
                kind: "EDUCATION",
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        testUser = await prisma.users.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                email: `fk-test-${Date.now()}@example.com`,
                name: "FK Test User",
                role: "TEACHER",
                schooling_level: "HIGH_SCHOOL",
                last_institution_id: testInstitution.id,
                created_at: new Date(),
                updated_at: new Date(),
                status: "ACTIVE",
            },
        });
        testContent = await prisma.contents.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                title: "Test Content for FK",
                type: "PDF",
                original_language: "PT_BR",
                raw_text: "Test content",
                created_by: testUser.id,
                owner_user_id: testUser.id,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        testAnnotation = await prisma.annotations.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                user_id: testUser.id,
                content_id: testContent.id,
                type: "HIGHLIGHT",
                start_offset: 0,
                end_offset: 10,
                visibility: "PRIVATE",
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    });
    afterAll(async () => {
        await prisma.annotations.deleteMany({ where: { user_id: testUser.id } });
        await prisma.contents.deleteMany({ where: { created_by: testUser.id } });
        await prisma.users.deleteMany({
            where: { email: { startsWith: "fk-test-" } },
        });
        await prisma.institutions.deleteMany({
            where: { name: "Test Institution FK" },
        });
        await prisma.$disconnect();
    });
    describe("TeacherVerification Foreign Keys", () => {
        test("should create teacher verification with FK to User", async () => {
            const verification = await prisma.teacher_verifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: testUser.id,
                    institution_id: testInstitution.id,
                    status: client_2.TeacherVerificationStatus.PENDING,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            expect(verification).toBeDefined();
            expect(verification.user_id).toBe(testUser.id);
            expect(verification.institution_id).toBe(testInstitution.id);
            await prisma.teacher_verifications.delete({
                where: { id: verification.id },
            });
        });
        test("should CASCADE delete teacher verification when User is deleted", async () => {
            const tempUser = await prisma.users.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    email: `temp-fk-${Date.now()}@example.com`,
                    name: "Temp User",
                    role: "TEACHER",
                    schooling_level: "HIGH_SCHOOL",
                    created_at: new Date(),
                    updated_at: new Date(),
                    status: "ACTIVE",
                },
            });
            const verification = await prisma.teacher_verifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: tempUser.id,
                    institution_id: testInstitution.id,
                    status: client_2.TeacherVerificationStatus.PENDING,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await prisma.users.delete({ where: { id: tempUser.id } });
            const deletedVerification = await prisma.teacher_verifications.findUnique({
                where: { id: verification.id },
            });
            expect(deletedVerification).toBeNull();
        });
        test("should CASCADE delete teacher verification when Institution is deleted", async () => {
            const tempInstitution = await prisma.institutions.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    name: "Temp Institution",
                    type: "SCHOOL",
                    kind: "EDUCATION",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            const verification = await prisma.teacher_verifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: testUser.id,
                    institution_id: tempInstitution.id,
                    status: client_2.TeacherVerificationStatus.PENDING,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await prisma.institutions.delete({ where: { id: tempInstitution.id } });
            const deletedVerification = await prisma.teacher_verifications.findUnique({
                where: { id: verification.id },
            });
            expect(deletedVerification).toBeNull();
        });
        test("should enforce unique constraint on user_id", async () => {
            const firstVerif = await prisma.teacher_verifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: testUser.id,
                    institution_id: testInstitution.id,
                    status: client_2.TeacherVerificationStatus.PENDING,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await expect(prisma.teacher_verifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: testUser.id,
                    institution_id: testInstitution.id,
                    status: client_2.TeacherVerificationStatus.VERIFIED,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            })).rejects.toThrow();
            await prisma.teacher_verifications.delete({
                where: { id: firstVerif.id },
            });
        });
    });
    describe("ContentShare Foreign Keys", () => {
        test("should create content share with FK to Content", async () => {
            const share = await prisma.content_shares.create({
                data: {
                    content_id: testContent.id,
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-123",
                    permission: client_2.SharePermission.VIEW,
                    created_at: new Date(),
                },
            });
            expect(share).toBeDefined();
            expect(share.content_id).toBe(testContent.id);
            await prisma.content_shares.deleteMany({
                where: {
                    content_id: testContent.id,
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-123",
                },
            });
        });
        test("should CASCADE delete content share when Content is deleted", async () => {
            const tempContent = await prisma.contents.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    title: "Temp Content",
                    type: "PDF",
                    original_language: "PT_BR",
                    raw_text: "Temp",
                    created_by: testUser.id,
                    owner_user_id: testUser.id,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            const share = await prisma.content_shares.create({
                data: {
                    content_id: tempContent.id,
                    context_type: client_2.ShareContextType.FAMILY,
                    context_id: "family-123",
                    permission: client_2.SharePermission.COMMENT,
                    created_at: new Date(),
                },
            });
            await prisma.contents.delete({ where: { id: tempContent.id } });
            const deletedShare = await prisma.content_shares.findFirst({
                where: {
                    content_id: tempContent.id,
                    context_type: client_2.ShareContextType.FAMILY,
                    context_id: "family-123",
                },
            });
            expect(deletedShare).toBeNull();
        });
        test("should enforce composite PK on (content_id, context_type, context_id)", async () => {
            await prisma.content_shares.create({
                data: {
                    content_id: testContent.id,
                    context_type: client_2.ShareContextType.STUDY_GROUP,
                    context_id: "group-123",
                    permission: client_2.SharePermission.VIEW,
                    created_at: new Date(),
                },
            });
            await expect(prisma.content_shares.create({
                data: {
                    content_id: testContent.id,
                    context_type: client_2.ShareContextType.STUDY_GROUP,
                    context_id: "group-123",
                    permission: client_2.SharePermission.ASSIGN,
                    created_at: new Date(),
                },
            })).rejects.toThrow();
            await prisma.content_shares.deleteMany({
                where: {
                    content_id: testContent.id,
                    context_type: client_2.ShareContextType.STUDY_GROUP,
                    context_id: "group-123",
                },
            });
        });
    });
    describe("AnnotationShare Foreign Keys", () => {
        test("should create annotation share with FK to Annotation", async () => {
            const share = await prisma.annotation_shares.create({
                data: {
                    annotation_id: testAnnotation.id,
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-456",
                    mode: client_2.AnnotationShareMode.VIEW,
                    created_at: new Date(),
                },
            });
            expect(share).toBeDefined();
            expect(share.annotation_id).toBe(testAnnotation.id);
            await prisma.annotation_shares.deleteMany({
                where: {
                    annotation_id: testAnnotation.id,
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-456",
                },
            });
        });
        test("should CASCADE delete annotation share when Annotation is deleted", async () => {
            const tempAnnotation = await prisma.annotations.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    user_id: testUser.id,
                    content_id: testContent.id,
                    type: "NOTE",
                    start_offset: 20,
                    end_offset: 40,
                    visibility: "PRIVATE",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            const share = await prisma.annotation_shares.create({
                data: {
                    annotation_id: tempAnnotation.id,
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-789",
                    mode: client_2.AnnotationShareMode.COMMENT,
                    created_at: new Date(),
                },
            });
            await prisma.annotations.delete({ where: { id: tempAnnotation.id } });
            const deletedShare = await prisma.annotation_shares.findFirst({
                where: {
                    annotation_id: tempAnnotation.id,
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-789",
                },
            });
            expect(deletedShare).toBeNull();
        });
    });
    describe("Comment Foreign Keys", () => {
        test("should create comment with FK to User (author)", async () => {
            const thread = await prisma.comment_threads.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-abc",
                    target_type: client_2.CommentTargetType.CONTENT,
                    target_id: testContent.id,
                    created_at: new Date(),
                },
            });
            const comment = await prisma.comments.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    thread_id: thread.id,
                    author_id: testUser.id,
                    body: "Test comment",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            expect(comment).toBeDefined();
            expect(comment.author_id).toBe(testUser.id);
            await prisma.comments.delete({ where: { id: comment.id } });
            await prisma.comment_threads.delete({ where: { id: thread.id } });
        });
        test("should CASCADE delete comment when User (author) is deleted", async () => {
            const tempUser = await prisma.users.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    email: `temp-comment-${Date.now()}@example.com`,
                    name: "Temp Comment User",
                    role: "STUDENT",
                    schooling_level: "MIDDLE_SCHOOL",
                    created_at: new Date(),
                    updated_at: new Date(),
                    status: "ACTIVE",
                },
            });
            const thread = await prisma.comment_threads.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    context_type: client_2.ShareContextType.CLASSROOM,
                    context_id: "classroom-def",
                    target_type: client_2.CommentTargetType.CONTENT,
                    target_id: testContent.id,
                    created_at: new Date(),
                },
            });
            const comment = await prisma.comments.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    thread_id: thread.id,
                    author_id: tempUser.id,
                    body: "Temp comment",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await prisma.users.delete({ where: { id: tempUser.id } });
            const deletedComment = await prisma.comments.findUnique({
                where: { id: comment.id },
            });
            expect(deletedComment).toBeNull();
            await prisma.comment_threads.delete({ where: { id: thread.id } });
        });
        test("should CASCADE delete comment when CommentThread is deleted", async () => {
            const thread = await prisma.comment_threads.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    context_type: client_2.ShareContextType.STUDY_GROUP,
                    context_id: "group-xyz",
                    target_type: client_2.CommentTargetType.ANNOTATION,
                    target_id: testAnnotation.id,
                    created_at: new Date(),
                },
            });
            const comment = await prisma.comments.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    thread_id: thread.id,
                    author_id: testUser.id,
                    body: "Thread comment",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await prisma.comment_threads.delete({ where: { id: thread.id } });
            const deletedComment = await prisma.comments.findUnique({
                where: { id: comment.id },
            });
            expect(deletedComment).toBeNull();
        });
    });
    describe("InstitutionPolicy Foreign Keys", () => {
        test("should create institution policy with FK to Institution", async () => {
            const policy = await prisma.institution_policies.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
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
            await prisma.institution_policies.delete({ where: { id: policy.id } });
        });
        test("should CASCADE delete policy when Institution is deleted", async () => {
            const tempInstitution = await prisma.institutions.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    name: "Temp Policy Institution",
                    type: "UNIVERSITY",
                    kind: "EDUCATION",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            const policy = await prisma.institution_policies.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    institution_id: tempInstitution.id,
                    allow_advanced_ai: false,
                    allow_external_sharing: true,
                    allow_text_extraction: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await prisma.institutions.delete({ where: { id: tempInstitution.id } });
            const deletedPolicy = await prisma.institution_policies.findUnique({
                where: { id: policy.id },
            });
            expect(deletedPolicy).toBeNull();
        });
        test("should enforce unique constraint on institution_id", async () => {
            const firstPolicy = await prisma.institution_policies.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    institution_id: testInstitution.id,
                    allow_advanced_ai: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await expect(prisma.institution_policies.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    institution_id: testInstitution.id,
                    allow_advanced_ai: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            })).rejects.toThrow();
            await prisma.institution_policies.delete({
                where: { id: firstPolicy.id },
            });
        });
    });
});
//# sourceMappingURL=subfase-2.1-fk-constraints.spec.js.map