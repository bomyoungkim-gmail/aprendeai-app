/**
 * Integration Tests - Cornell Notes
 * 
 * Tests Cornell Notes API with real database:
 * - Auto-create on first GET
 * - Save notes (PUT)
 * - Retrieve saved notes (GET)
 * - Update existing notes
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Cornell Notes Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;
  let testContentId: string;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Setup test user
    const user = await prisma.user.create({
      data: {
        email: `cornell-test-${Date.now()}@example.com`,
        name: 'Cornell Test User',
        passwordHash: 'hash',
        role: 'COMMON_USER',
        schoolingLevel: 'ADULT',
        status: 'ACTIVE',
      },
    });
    testUserId = user.id;
    
    // Create test content
    const content = await prisma.content.create({
      data: {
        ownerUserId: testUserId,
        title: 'Cornell Test Content',
        type: 'PDF',
        originalLanguage: 'EN',
        rawText: 'Test content for Cornell notes testing.',
      },
    });
    testContentId = content.id;
    
    authToken = 'Bearer test-token';
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.cornellNote.deleteMany({ where: { userId: testUserId } });
    await prisma.content.deleteMany({ where: { id: testContentId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });
  
  describe('GET /contents/:id/cornell - Auto-create', () => {
    it('should create empty Cornell notes on first GET', async () => {
      const response = await request(app.getHttpServer())
        .get(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.contentId).toBe(testContentId);
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.mainNotes).toEqual({});
      expect(response.body.cueColumn).toBeNull();
      expect(response.body.summaryText).toBeNull();
    });
    
    it('should return existing Cornell notes on subsequent GET', async () => {
      // First GET creates it
      const first = await request(app.getHttpServer())
        .get(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .expect(200);
      
      const createdId = first.body.id;
      
      // Second GET returns same
      const second = await request(app.getHttpServer())
        .get(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .expect(200);
      
      expect(second.body.id).toBe(createdId);
    });
  });
  
  describe('PUT /contents/:id/cornell - Save Notes', () => {
    beforeEach(async () => {
      // Clean existing notes
      await prisma.cornellNote.deleteMany({
        where: { userId: testUserId },
      });
    });
    
    it('should save main notes', async () => {
      const mainNotes = {
        '1': 'First note about the content',
        '2': 'Second important point',
        '3': 'Third observation',
      };
      
      const response = await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send({ mainNotes })
        .expect(200);
      
      expect(response.body.mainNotes).toEqual(mainNotes);
    });
    
    it('should save cue column', async () => {
      const cueColumn = 'Key questions:\n- What is X?\n- Why Y?\n- How Z?';
      
      const response = await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send({ cueColumn })
        .expect(200);
      
      expect(response.body.cueColumn).toBe(cueColumn);
    });
    
    it('should save summary text', async () => {
      const summaryText = 'This is a comprehensive summary of everything I learned from this content.';
      
      const response = await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send({ summaryText })
        .expect(200);
      
      expect(response.body.summaryText).toBe(summaryText);
    });
    
    it('should save all fields together', async () => {
      const data = {
        mainNotes: {
          '1': 'Note 1',
          '2': 'Note 2',
        },
        cueColumn: 'Question 1\nQuestion 2',
        summaryText: 'Complete summary of the content',
      };
      
      const response = await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send(data)
        .expect(200);
      
      expect(response.body.mainNotes).toEqual(data.mainNotes);
      expect(response.body.cueColumn).toBe(data.cueColumn);
      expect(response.body.summaryText).toBe(data.summaryText);
    });
  });
  
  describe('Cornell Notes Persistence', () => {
    it('should persist changes across GET requests', async () => {
      const data = {
        mainNotes: { '1': 'Persisted note' },
        summaryText: 'Persisted summary',
      };
      
      // Save
      await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send(data)
        .expect(200);
      
      // Retrieve
      const response = await request(app.getHttpServer())
        .get(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .expect(200);
      
      expect(response.body.mainNotes).toEqual(data.mainNotes);
      expect(response.body.summaryText).toBe(data.summaryText);
    });
    
    it('should update existing notes without losing data', async () => {
      // Initial save
      await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send({
          mainNotes: { '1': 'Original' },
          summaryText: 'Original summary',
        })
        .expect(200);
      
      // Update only cueColumn
      const updated = await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send({
          cueColumn: 'New cue column',
        })
        .expect(200);
      
      // Should keep original data
      expect(updated.body.mainNotes).toEqual({ '1': 'Original' });
      expect(updated.body.summaryText).toBe('Original summary');
      expect(updated.body.cueColumn).toBe('New cue column');
    });
  });
  
  describe('Cornell Notes Validation', () => {
    it('should reject invalid mainNotes format', async () => {
      await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send({
          mainNotes: 'not an object',  // Should be object
        })
        .expect(400);
    });
    
    it('should allow empty cornell notes', async () => {
      const response = await request(app.getHttpServer())
        .put(`/contents/${testContentId}/cornell`)
        .set('Authorization', authToken)
        .send({
          mainNotes: {},
          cueColumn: '',
          summaryText: '',
        })
        .expect(200);
      
      expect(response.body.mainNotes).toEqual({});
    });
  });
});
