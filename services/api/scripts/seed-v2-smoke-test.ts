
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PermissionEvaluator } from '../src/auth/domain/permission.evaluator';
import { SharingService } from '../src/sharing/sharing.service';
import { ThreadsService } from '../src/sharing/threads.service';
import { ClassroomService } from '../src/classroom/services/classroom.service';
import { ClassGradebookService } from '../src/classroom/services/class-gradebook.service';
import * as uuid from 'uuid';
// Enums might be available from prisma/client directly
import { ShareContextType } from '../src/sharing/dto/sharing.dto'; // DTO enums
import { SharePermission, CommentTargetType } from '../src/sharing/dto/sharing.dto';

const uuidv4 = uuid.v4;

async function verify(description: string, check: () => Promise<boolean>) {
  try {
    const result = await check();
    if (result) {
        console.log(`[PASS] ${description}`);
    } else {
        console.error(`[FAIL] ${description} - Returned false`);
        // We continue to see other failures? No, exit on fail is safer for CI behavior
        process.exit(1);
    }
  } catch (e) {
    console.error(`[FAIL] ${description} - Exception: ${e.message}`);
    process.exit(1);
  }
}

async function verifyThrows(description: string, check: () => Promise<any>) {
    try {
        await check();
        console.error(`[FAIL] ${description} - Should have thrown but succeeded`);
        process.exit(1);
    } catch (e) {
        console.log(`[PASS] ${description} (Threw ${e.message})`);
    }
}

async function bootstrap() {
  console.log('--- STARTING SMOKE TESTS V2 ---');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const permissions = app.get(PermissionEvaluator);
  const sharingService = app.get(SharingService);
  const threadsService = app.get(ThreadsService);
  const classroomService = app.get(ClassroomService);
  const gradebookService = app.get(ClassGradebookService);

  const timestamp = Date.now();
  const suffix = `_${timestamp}`;

  // 1. Create Institution
  console.log('\n--> Creating Institution');
  const inst = await prisma.institutions.create({
    data: {
      id: uuidv4(),
      name: `Smoke Inst ${suffix}`,
      type: 'SCHOOL',
      kind: 'EDUCATION', 
      slug: `smoke-inst-${timestamp}`,
      updated_at: new Date()
    } as any
  });

  // 2. Create Users
  console.log('\n--> Creating Users');
  const commonUserData = { schooling_level: 'OTHER', updated_at: new Date() };

  const userSystemAdmin = await prisma.users.create({
    data: { id: uuidv4(), name: 'System Admin', email: `sysadmin${suffix}@test.com`, system_role: 'ADMIN', password_hash: 'hashed', ...commonUserData } as any
  });
  const userInstAdmin = await prisma.users.create({
    data: { id: uuidv4(), name: 'Inst Admin', email: `instadmin${suffix}@test.com`, institution_id: inst.id, context_role: 'INSTITUTION_EDUCATION_ADMIN', password_hash: 'hashed', ...commonUserData } as any
  });
  const userTeacher = await prisma.users.create({
    data: { id: uuidv4(), name: 'Teacher', email: `teacher${suffix}@test.com`, institution_id: inst.id, context_role: 'TEACHER', password_hash: 'hashed', ...commonUserData } as any
  });
  const userStudent = await prisma.users.create({
    data: { id: uuidv4(), name: 'Student', email: `student${suffix}@test.com`, institution_id: inst.id, context_role: 'STUDENT', password_hash: 'hashed', ...commonUserData } as any
  });
  const userOwner = await prisma.users.create({
    data: { id: uuidv4(), name: 'Owner Indiv', email: `owner${suffix}@test.com`, context_role: 'OWNER', password_hash: 'hashed', ...commonUserData } as any
  });

  // 3. Institution Members
  await prisma.institution_members.createMany({
    data: [
        { id: uuidv4(), institution_id: inst.id, user_id: userInstAdmin.id, role: 'INSTITUTION_EDUCATION_ADMIN', status: 'ACTIVE' },
        { id: uuidv4(), institution_id: inst.id, user_id: userTeacher.id, role: 'TEACHER', status: 'ACTIVE' },
        { id: uuidv4(), institution_id: inst.id, user_id: userStudent.id, role: 'STUDENT', status: 'ACTIVE' }
    ] as any
  });

  await verify('Owner Individual context created', async () => !!userOwner.id);

  // CHECKLIST: Main Teacher logic
  await verify('Unverified Teacher cannot create classroom', async () => {
      const can = await permissions.canCreateClassroom(userTeacher.id);
      return can === false;
  });

  // 4. Verify Teacher
  console.log('\n--> Verifying Teacher');
  await prisma.teacher_verifications.create({
      data: {
          id: uuidv4(),
          user: { connect: { id: userTeacher.id } },
          institution: { connect: { id: inst.id } }, 
          status: 'VERIFIED',
          updated_at: new Date()
      } as any
  });

  await verify('Verified Teacher can create classroom', async () => {
      const can = await permissions.canCreateClassroom(userTeacher.id);
      return can === true;
  });

  // 5. Create Classroom
  console.log('\n--> Creating Classroom');
  const classroom = await classroomService.create({
      name: `Class 101 ${suffix}`,
      ownerEducatorUserId: userTeacher.id,
      institutionId: inst.id,
      gradeLevel: '10'
  });
  await verify('Classroom created', async () => !!classroom.id);

  // Enroll Student
  await prisma.enrollments.create({
      data: {
          id: uuidv4(),
          classroom_id: classroom.id,
          learner_user_id: userStudent.id,
          status: 'ACTIVE'
      } as any
  });

  // 6. Create Content & Share
  console.log('\n--> Creating Content & Sharing (ASSIGN)');
  const content = await prisma.contents.create({
      data: {
          id: uuidv4(),
          title: 'Lesson PDF',
          type: 'PDF',
          original_language: 'EN',
          raw_text: 'Sample text', 
          owner_user_id: userTeacher.id,
          updated_at: new Date()
      } as any
  });

  await sharingService.shareContent(userTeacher.id, content.id, {
      contextType: ShareContextType.CLASSROOM,
      contextId: classroom.id,
      permission: SharePermission.ASSIGN
  });
  await verify('Content successfully assigned to classroom', async () => {
      const share = await prisma.content_shares.findUnique({
          where: { content_id_context_type_context_id: { content_id: content.id, context_type: 'CLASSROOM', context_id: classroom.id } }
      });
      return share?.permission === 'ASSIGN';
  });

  // 7. Thread & Comments
  console.log('\n--> Testing Threads & Comments');
  const thread = await threadsService.getThread({
      contextType: ShareContextType.CLASSROOM,
      contextId: classroom.id,
      targetType: CommentTargetType.CONTENT,
      targetId: content.id
  });
  await verify('Thread created (lazy)', async () => !!thread.id);

  await threadsService.createComment(thread.id, userStudent.id, { body: 'I have a question.' });
  await verify('Student commented on Assigned content', async () => {
      const comments = await prisma.comments.findMany({ where: { thread_id: thread.id }});
      return comments.length > 0;
  });

  const comment = (await prisma.comments.findFirst({ where: { thread_id: thread.id } }));
  await threadsService.deleteComment(comment.id, userStudent.id);
  await verify('Student soft-deleted their comment', async () => {
      const c = await prisma.comments.findUnique({ where: { id: comment.id }});
      return !!c.deleted_at;
  });

  // 8. Study Item & Submission
  console.log('\n--> Study Items & Gradebook');
  // Create Plan Week
  await prisma.class_plan_weeks.create({
      data: {
          id: uuidv4(),
          classrooms: { connect: { id: classroom.id } },
          users: { connect: { id: userTeacher.id } },
          week_start: new Date(),
          items_json: [content.id],
          updated_at: new Date()
      } as any
  });
  
  // Submission
  await prisma.game_results.create({
      data: {
          id: uuidv4(),
          user_id: userStudent.id,
          content_id: content.id,
          score: 85,
          game_type: 'QUIZ',
          played_at: new Date(),
          metadata: {
            mode: 'SOLO',
            max_score: 100
          }
      } as any
  });

  // 9. Export CSV
  const csv = await gradebookService.exportGradebookCsv(classroom.id);
  console.log('CSV Output Preview:', csv.substring(0, 100));
  await verify('CSV Generated containing Student Name', async () => csv.includes('Student'));

  // 10. Family
  console.log('\n--> Creating Family');
  const family = await prisma.families.create({
      data: { 
          id: uuidv4(), 
          name: 'Smoke Family', 
          updated_at: new Date(),
          users_owner: { connect: { id: userOwner.id } }
      }
  });
  await prisma.family_members.create({
      data: { 
          id: uuidv4(), 
          family_id: family.id, 
          user_id: userOwner.id, 
          role: 'OWNER', 
          learning_role: 'EDUCATOR', 
          status: 'ACTIVE' 
      }
  });
  const child = await prisma.users.create({ 
      data: { id: uuidv4(), name: 'Child', email: `child${suffix}@test.com`, password_hash: 'hashed', ...commonUserData } as any
  });
  await prisma.family_members.create({
      data: { 
          id: uuidv4(), 
          family_id: family.id, 
          user_id: child.id, 
          role: 'CHILD', 
          learning_role: 'LEARNER', 
          status: 'ACTIVE' 
      }
  });
  
  await verify('Family created with members', async () => {
      const count = await prisma.family_members.count({ where: { family_id: family.id } });
      return count === 2;
  });

  // 11. Study Group & Share (VIEW)
  console.log('\n--> Study Group');
  const group = await prisma.study_groups.create({
      data: { 
          id: uuidv4(), 
          name: 'Study Group V2', 
          users_owner: { connect: { id: userStudent.id } }
      }
  });
  await prisma.study_group_members.create({
      data: { 
          id: uuidv4(),
          group_id: group.id, 
          user_id: userStudent.id, 
          role: 'OWNER', 
          status: 'ACTIVE' 
      } as any
  });

  await sharingService.shareContent(userTeacher.id, content.id, { 
       contextType: ShareContextType.STUDY_GROUP,
       contextId: group.id,
       permission: SharePermission.VIEW 
  });

  const groupThread = await threadsService.getThread({
      contextType: ShareContextType.STUDY_GROUP,
      contextId: group.id,
      targetType: CommentTargetType.CONTENT,
      targetId: content.id
  });

  await verifyThrows('Student cannot comment on VIEW-only content in Group', async () => {
      await threadsService.createComment(groupThread.id, userStudent.id, { body: 'Commenting on view only?' });
  });

  await sharingService.shareContent(userTeacher.id, content.id, {
      contextType: ShareContextType.STUDY_GROUP,
      contextId: group.id,
      permission: SharePermission.COMMENT
  });
  await verify('Student CAN comment after upgrade to COMMENT', async () => {
      const c = await threadsService.createComment(groupThread.id, userStudent.id, { body: 'Now I can comment' });
      return !!c.id;
  });

  console.log('\n--- SMOKE TESTS PASSED ---');
  await app.close();
}

bootstrap();
