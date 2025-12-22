import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as request from 'supertest';

describe('Classroom Mode Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let classroomId: string;
  let teacherId: string;
  let studentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    authToken = 'mock-jwt-token';
    teacherId = 'teacher_test_123';
    studentId = 'student_test_456';
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Classroom CRUD Flow', () => {
    it('should create a classroom', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/classrooms')
        .set('Authorization', `Bearer ${authToken}`)
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
        .get(`/api/v1/classrooms/${classroomId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(classroomId);
      expect(response.body).toHaveProperty('enrollments');
    });

    it('should update classroom', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/classrooms/${classroomId}`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .post(`/api/v1/classrooms/${classroomId}/enroll`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .get(`/api/v1/classrooms/${classroomId}/enrollments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].learnerUserId).toBe(studentId);
    });
  });

  describe('Classroom Policy Flow', () => {
    it('should create classroom policy', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/classrooms/${classroomId}/policy`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .post(`/api/v1/classrooms/${classroomId}/policy/prompt`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .post(`/api/v1/classrooms/${classroomId}/plans/weekly`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .get(`/api/v1/classrooms/${classroomId}/plans/weekly`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('itemsJson');
    });
  });

  describe('Dashboard with Privacy Filtering', () => {
    it('should get teacher dashboard with privacy filtering', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/classrooms/${classroomId}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`);

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
        .post(`/api/v1/classrooms/${classroomId}/interventions`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .post(`/api/v1/classrooms/${classroomId}/interventions/prompt`)
        .set('Authorization', `Bearer ${authToken}`)
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
