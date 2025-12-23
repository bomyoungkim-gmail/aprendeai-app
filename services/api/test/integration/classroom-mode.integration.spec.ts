import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as request from 'supertest';
import { TestAuthHelper, createTestUser } from '../helpers/auth.helper';
import { apiUrl } from '../helpers/routes';

describe('Classroom Mode Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let userId: string;
  let classroomId: string;
  let teacherId: string;
  let studentId: string;
  let teacherEmail: string;
  let studentEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1'); // Match production
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    const configService = app.get<ConfigService>(ConfigService);

    // Setup auth with TestAuthHelper
    const secret = configService.get<string>('JWT_SECRET') || 'test-secret-key';
    authHelper = new TestAuthHelper(secret);

    // Create unique teacher user
    teacherEmail = `teacher_${Date.now()}@example.com`;
    const teacherUser = await prisma.user.upsert({
      where: { email: teacherEmail },
      create: {
        email: teacherEmail,
        name: 'Teacher Test',
        passwordHash: 'hash',
        role: 'TEACHER',
        schoolingLevel: 'HIGHER_EDUCATION',
        status: 'ACTIVE',
      },
      update: {},
    });
    
    userId = teacherUser.id;
    teacherId = teacherUser.id;
    authToken = authHelper.generateAuthHeader({
      id: teacherUser.id,
      email: teacherUser.email,
      name: teacherUser.name,
    });

    // Create unique student user
    studentEmail = `student_${Date.now()}@example.com`;
    const studentUser = await prisma.user.upsert({
      where: { email: studentEmail },
      create: {
        email: studentEmail,
        name: 'Student Maria',
        passwordHash: 'hash',
        role: 'COMMON_USER',
        schoolingLevel: 'ELEMENTARY',
        status: 'ACTIVE',
      },
      update: {},
    });
    studentId = studentUser.id;
  });

  afterAll(async () => {
    // Cleanup
    if (classroomId) {
      await prisma.classroom.delete({ where: { id: classroomId } }).catch(() => {});
    }
    if (teacherId) {
      await prisma.user.delete({ where: { id: teacherId } }).catch(() => {});
    }
    if (studentId) {
      await prisma.user.delete({ where: { id: studentId } }).catch(() => {});
    }
    await app.close();
  });

  describe('Classroom CRUD Flow', () => {
    it('should create a classroom', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl('classrooms'))
        .set('Authorization', authToken)
        .send({
          ownerEducatorUserId: teacherId,
          name: 'Turma 5A - Teste',
          gradeLevel: '5º Ano',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Turma 5A - Teste');
      
      classroomId = response.body.id;
    });

    it('should get classroom by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(`classrooms/${classroomId}`))
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(classroomId);
      expect(response.body).toHaveProperty('enrollments');
    });

    it('should update classroom', async () => {
      const response = await request(app.getHttpServer())
        .put(apiUrl(`classrooms/${classroomId}`))
        .set('Authorization', authToken)
        .send({
          name: 'Turma 5A - Atualizada',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Turma 5A - Atualizada');
    });
  });

  describe('Enrollment Flow', () => {
    it('should enroll student in classroom', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`classrooms/${classroomId}/enroll`))
        .set('Authorization', authToken)
        .send({
          learnerUserId: studentId,
          nickname: 'Maria',
        });

      expect(response.status).toBe(201);
      expect(response.body.learnerUserId).toBe(studentId);
      expect(response.body.status).toBe('ACTIVE');
    });

    it('should get enrollments for classroom', async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(`classrooms/${classroomId}/enrollments`))
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].learnerUserId).toBe(studentId);
    });
  });

  describe('Classroom Policy Flow', () => {
    it('should create classroom policy', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`classrooms/${classroomId}/policy`))
        .set('Authorization', authToken)
        .send({
          weeklyUnitsTarget: 3,
          timeboxDefaultMin: 20,
          privacyMode: 'AGGREGATED_PLUS_HELP_REQUESTS',
          interventionMode: 'PROMPT_COACH_PLUS_1ON1',
        });

      expect(response.status).toBe(201);
      expect(response.body.weeklyUnitsTarget).toBe(3);
      expect(response.body.privacyMode).toBe('AGGREGATED_PLUS_HELP_REQUESTS');
    });

    it('should get policy prompt', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`classrooms/${classroomId}/policy/prompt`))
        .set('Authorization', authToken)
        .send({
          units: 3,
          minutes: 20,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nextPrompt');
      expect(response.body.nextPrompt).toContain('3');
    });
  });

  describe('Weekly Planning Flow', () => {
    it('should create weekly plan', async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

      const response = await request(app.getHttpServer())
        .post(apiUrl(`classrooms/${classroomId}/plans/weekly`))
        .set('Authorization', authToken)
        .send({
          weekStart,
          items: ['content_1', 'content_2', 'content_3'],
          toolWords: ['palavra1', 'palavra2'],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('itemsJson');
      expect(response.body.itemsJson).toHaveLength(3);
    });

    it('should get current week plan', async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(`classrooms/${classroomId}/plans/weekly`))
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('itemsJson');
    });
  });

  describe('Dashboard with Privacy Filtering', () => {
    it('should get teacher dashboard with privacy filtering', async () => {
      const response = await request(app.getHttpServer())
        .get(apiUrl(`classrooms/${classroomId}/dashboard`))
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('activeStudents');
      expect(response.body).toHaveProperty('students');
      expect(response.body.privacyMode).toBe('AGGREGATED_PLUS_HELP_REQUESTS');
      
      // With AGGREGATED_PLUS_HELP_REQUESTS: should have helpRequests but not comprehensionScore
      const student = response.body.students[0];
      if (student) {
        expect(student).toHaveProperty('progressPercent');
        expect(student).toHaveProperty('helpRequests'); // Visible
        expect(student.comprehensionScore).toBeUndefined(); // Hidden
      }
    });
  });

  describe('Intervention Flow', () => {
    it('should log student help request', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`classrooms/${classroomId}/interventions`))
        .set('Authorization', authToken)
        .send({
          learnerUserId: studentId,
          topic: 'vocabulário',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('PENDING');
    });

    it('should get intervention prompt', async () => {
      const response = await request(app.getHttpServer())
        .post(apiUrl(`classrooms/${classroomId}/interventions/prompt`))
        .set('Authorization', authToken)
        .send({
          studentName: 'Maria',
          topic: 'vocabulário',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('nextPrompt');
      expect(response.body.nextPrompt).toContain('Maria');
    });
  });
});
