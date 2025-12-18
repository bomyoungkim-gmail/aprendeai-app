/**
 * Unit tests for Gating Service - Layer Eligibility Logic
 * 
 * Tests L2/L3 eligibility determination and fallback scenarios.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GatingService } from '../../src/gating/gating.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('GatingService - Unit Tests', () => {
  let service: GatingService;
  let prisma: PrismaService;
  
  const mockPrisma = {
    layerEligibility: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    readingSession: {
      findMany: jest.fn(),
    },
  };
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    
    service = module.get<GatingService>(GatingService);
    prisma = module.get<PrismaService>(PrismaService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
 describe('determineLayer - Default Behavior', () => {
    it('should return L1 for new users without eligibility', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue(null);
      mockPrisma.layerEligibility.create.mockResolvedValue({
        eligibleL2: false,
        eligibleL3: false,
      });
      
      const result = await service.determineLayer('user-1', 'content-1');
      
      expect(result).toBe('L1');
    });
    
    it('should always allow L1 when requested', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue({
        eligibleL2: true,
        eligibleL3: true,
      });
      
      const result = await service.determineLayer('user-1', 'content-1', 'L1');
      
      expect(result).toBe('L1');
    });
  });
  
  describe('determineLayer - L2 Eligibility', () => {
    it('should return L2 when user is eligible and requests it', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue({
        eligibleL2: true,  
        eligibleL3: false,
      });
      
      const result = await service.determineLayer('user-1', 'content-1', 'L2');
      
      expect(result).toBe('L2');
    });
    
    it('should fallback to L1 when L2 requested but not eligible', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue({
        eligibleL2: false,
        eligibleL3: false,
      });
      
      const result = await service.determineLayer('user-1', 'content-1', 'L2');
      
      expect(result).toBe('L1');
    });
    
    it('should allow L2 for L3-eligible users', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue({
        eligibleL2: false,
        eligibleL3: true,
      });
      
      const result = await service.determineLayer('user-1', 'content-1', 'L2');
      
      expect(result).toBe('L2');  // L3 users can use L2
    });
  });
  
  describe('determineLayer - L3 Eligibility', () => {
    it('should return L3 when user is eligible and requests it', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue({
        eligibleL2: true,
        eligibleL3: true,
      });
      
      const result = await service.determineLayer('user-1', 'content-1', 'L3');
      
      expect(result).toBe('L3');
    });
    
    it('should fallback to L2 when L3 requested but only L2 eligible', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue({
        eligibleL2: true,
        eligibleL3: false,
      });
      
      const result = await service.determineLayer('user-1', 'content-1', 'L3');
      
      expect(result).toBe('L2');
    });
    
    it('should fallback to L1 when L3 requested but not eligible', async () => {
      mockPrisma.layerEligibility.findUnique.mockResolvedValue({
        eligibleL2: false,
        eligibleL3: false,
      });
      
      const result = await service.determineLayer('user-1', 'content-1', 'L3');
      
      expect(result).toBe('L1');
    });
  });
  
  describe('checkL2Eligibility - Minimum Sessions', () => {
    it('should return false with less than 3 sessions', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 70, frustrationIndex: 40 } },
        { outcome: { comprehensionScore: 75, frustrationIndex: 35 } },
      ]);
      
      const result = await service['checkL2Eligibility']('user-1');
      
      expect(result).toBe(false);
    });
    
    it('should return true with 3+ good sessions', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 70, frustrationIndex: 40 } },
        { outcome: { comprehensionScore: 65, frustrationIndex: 45 } },
        { outcome: { comprehensionScore: 75, frustrationIndex: 35 } },
      ]);
      
      const result = await service['checkL2Eligibility']('user-1');
      
      expect(result).toBe(true);
    });
  });
  
  describe('checkL2Eligibility - Criteria', () => {
    it('should require avg comprehension >= 60', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 50, frustrationIndex: 40 } },
        { outcome: { comprehensionScore: 55, frustrationIndex: 40 } },
        { outcome: { comprehensionScore: 60, frustrationIndex: 40 } },
      ]);
      
      // Average = 55, should fail
      const result = await service['checkL2Eligibility']('user-1');
      
      expect(result).toBe(false);
    });
    
    it('should require avg frustration <= 50', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 70, frustrationIndex: 55 } },
        { outcome: { comprehensionScore: 70, frustrationIndex: 60 } },
        { outcome: { comprehensionScore: 70, frustrationIndex: 50 } },
      ]);
      
      // Average frustration = 55, should fail
      const result = await service['checkL2Eligibility']('user-1');
      
      expect(result).toBe(false);
    });
    
    it('should pass with avg comp=65, frust=45', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 60, frustrationIndex: 50 } },
        { outcome: { comprehensionScore: 70, frustrationIndex: 40 } },
        { outcome: { comprehensionScore: 65, frustrationIndex: 45 } },
      ]);
      
      const result = await service['checkL2Eligibility']('user-1');
      
      expect(result).toBe(true);
    });
  });
  
  describe('checkL3Eligibility - Requirements', () => {
    it('should return false with less than 5 sessions', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 80, productionScore: 75, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 78, productionScore: 72, frustrationIndex: 38 } },
        { outcome: { comprehensionScore: 76, productionScore: 71, frustrationIndex: 39 } },
        { outcome: { comprehensionScore: 81, productionScore: 78, frustrationIndex: 30 } },
      ]);
      
      const result = await service['checkL3Eligibility']('user-1');
      
      expect(result).toBe(false);
    });
    
    it('should require avg comprehension >= 75', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 70, productionScore: 75, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 72, productionScore: 75, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 73, productionScore: 75, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 74, productionScore: 75, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 71, productionScore: 75, frustrationIndex: 35 } },
      ]);
      
      // Average = 72, should fail
      const result = await service['checkL3Eligibility']('user-1');
      
      expect(result).toBe(false);
    });
    
    it('should require avg production >= 70', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 80, productionScore: 65, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 80, productionScore: 68, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 80, productionScore: 67, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 80, productionScore: 69, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 80, productionScore: 66, frustrationIndex: 35 } },
      ]);
      
      // Average production = 67, should fail
      const result = await service['checkL3Eligibility']('user-1');
      
      expect(result).toBe(false);
    });
    
    it('should require avg frustration <= 40', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 80, productionScore: 75, frustrationIndex: 45 } },
        { outcome: { comprehensionScore: 80, productionScore: 75, frustrationIndex: 42 } },
        { outcome: { comprehensionScore: 80, productionScore: 75, frustrationIndex: 43 } },
        { outcome: { comprehensionScore: 80, productionScore: 75, frustrationIndex: 44 } },
        { outcome: { comprehensionScore: 80, productionScore: 75, frustrationIndex: 41 } },
      ]);
      
      // Average frustration = 43, should fail
      const result = await service['checkL3Eligibility']('user-1');
      
      expect(result).toBe(false);
    });
    
    it('should pass with all criteria met', async () => {
      mockPrisma.readingSession.findMany.mockResolvedValue([
        { outcome: { comprehensionScore: 75, productionScore: 70, frustrationIndex: 40 } },
        { outcome: { comprehensionScore: 80, productionScore: 75, frustrationIndex: 35 } },
        { outcome: { comprehensionScore: 78, productionScore: 72, frustrationIndex: 38 } },
        { outcome: { comprehensionScore: 76, productionScore: 71, frustrationIndex: 39 } },
        { outcome: { comprehensionScore: 81, productionScore: 78, frustrationIndex: 30 } },
      ]);
      
      // Averages: comp=78, prod=73.2, frust=36.4
      const result = await service['checkL3Eligibility']('user-1');
      
      expect(result).toBe(true);
    });
  });
});
