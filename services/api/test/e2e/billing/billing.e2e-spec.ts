import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module'; // Adjust path
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Billing (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get<PrismaService>(PrismaService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    await app.init();
  }, 60000); // Higher timeout for compilation

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  const testEmail = `e2e-billing-${Date.now()}@example.com`;
  let authToken: string;

  it('should authenticate and return entitlements', async () => {
    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'E2E Billing User',
        passwordHash: 'hashed',
        role: 'STUDENT',
        schoolingLevel: 'The rest',
        entitlementSnapshot: {
          create: {
             source: 'FREE',
             planType: 'FREE',
             limits: { seats: 1 },
             features: {}
          }
        }
      },
    });

    // 2. Generate Token
    authToken = jwtService.sign({ sub: user.id, email: user.email });

    // 3. GET /me/entitlements
    const response = await request(app.getHttpServer())
      .get('/me/entitlements')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('source', 'FREE');
    expect(response.body).toHaveProperty('planType', 'FREE');
  });
});
