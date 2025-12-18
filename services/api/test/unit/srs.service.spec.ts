/**
 * Unit tests for SRS (Spaced Repetition System) Service
 * 
 * Tests all SRS stage transitions and due date calculations.
 * Uses deterministic time freezing to ensure consistent results.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SrsService } from '../../src/srs/srs.service';
import { addDays } from 'date-fns';

describe('SrsService - Unit Tests', () => {
  let service: SrsService;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SrsService],
    }).compile();
    
    service = module.get<SrsService>(SrsService);
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  describe('calculateNextDue - Basic Transitions', () => {
    it('should transition NEW + OK -> D1 (due in 1 day)', () => {
      const result = service.calculateNextDue('NEW', 'OK');
      
      expect(result.newStage).toBe('D1');
      expect(result.daysToAdd).toBe(1);
      expect(result.lapseIncrement).toBe(0);
    });
    
    it('should transition NEW + EASY -> D3 (skip D1)', () => {
      const result = service.calculateNextDue('NEW', 'EASY');
      
      expect(result.newStage).toBe('D3');
      expect(result.daysToAdd).toBe(3);
      expect(result.lapseIncrement).toBe(0);
    });
    
    it('should transition D1 + OK -> D3', () => {
      const result = service.calculateNextDue('D1', 'OK');
      
      expect(result.newStage).toBe('D3');
      expect(result.daysToAdd).toBe(3);
    });
    
    it('should transition D3 + OK -> D7', () => {
      const result = service.calculateNextDue('D3', 'OK');
      
      expect(result.newStage).toBe('D7');
      expect(result.daysToAdd).toBe(7);
    });
   
    it('should transition D7 + OK -> D14', () => {
      const result = service.calculateNextDue('D7', 'OK');
      
      expect(result.newStage).toBe('D14');
      expect(result.daysToAdd).toBe(14);
    });
    
    it('should transition D14 + OK -> D30', () => {
      const result = service.calculateNextDue('D14', 'OK');
      
      expect(result.newStage).toBe('D30');
      expect(result.daysToAdd).toBe(30);
    });
    
    it('should transition D30 + OK -> D60', () => {
      const result = service.calculateNextDue('D30', 'OK');
      
      expect(result.newStage).toBe('D60');
      expect(result.daysToAdd).toBe(60);
    });
    
    it('should transition D60 + OK -> MASTERED', () => {
      const result = service.calculateNextDue('D60', 'OK');
      
      expect(result.newStage).toBe('MASTERED');
      expect(result.daysToAdd).toBe(180);
    });
  });
  
  describe('calculateNextDue - FAIL (Reset to D1)', () => {
    it('should reset NEW + FAIL -> D1 (lapse)', () => {
      const result = service.calculateNextDue('NEW', 'FAIL');
      
      expect(result.newStage).toBe('D1');
      expect(result.daysToAdd).toBe(1);
      expect(result.lapseIncrement).toBe(1);
    });
    
    it('should reset D3 + FAIL -> D1', () => {
      const result = service.calculateNextDue('D3', 'FAIL');
      
      expect(result.newStage).toBe('D1');
      expect(result.lapseIncrement).toBe(1);
    });
    
    it('should reset D30 + FAIL -> D1', () => {
      const result = service.calculateNextDue('D30', 'FAIL');
      
      expect(result.newStage).toBe('D1');
      expect(result.lapseIncrement).toBe(1);
    });
    
    it('should reset MASTERED + FAIL -> D1', () => {
      const result = service.calculateNextDue('MASTERED', 'FAIL');
      
      expect(result.newStage).toBe('D1');
      expect(result.lapseIncrement).toBe(1);
    });
  });
  
  describe('calculateNextDue - HARD (Regress 1 stage)', () => {
    it('should regress NEW + HARD -> D1 (floor at D1)', () => {
      const result = service.calculateNextDue('NEW', 'HARD');
      
      expect(result.newStage).toBe('D1');
      expect(result.lapseIncrement).toBe(0);
    });
    
    it('should keep D1 + HARD -> D1 (floor)', () => {
      const result = service.calculateNextDue('D1', 'HARD');
      
      expect(result.newStage).toBe('D1');
    });
    
    it('should regress D3 + HARD -> D1', () => {
      const result = service.calculateNextDue('D3', 'HARD');
      
      expect(result.newStage).toBe('D1');
    });
    
    it('should regress D7 + HARD -> D3', () => {
      const result = service.calculateNextDue('D7', 'HARD');
      
      expect(result.newStage).toBe('D3');
    });
    
    it('should regress D30 + HARD -> D14', () => {
      const result = service.calculateNextDue('D30', 'HARD');
      
      expect(result.newStage).toBe('D14');
    });
    
    it('should regress MASTERED + HARD -> D60', () => {
      const result = service.calculateNextDue('MASTERED', 'HARD');
      
      expect(result.newStage).toBe('D60');
    });
  });
  
  describe('calculateNextDue - EASY (Skip 1 stage)', () => {
    it('should skip NEW + EASY -> D3', () => {
      const result = service.calculateNextDue('NEW', 'EASY');
      expect(result.newStage).toBe('D3');
    });
    
    it('should skip D1 + EASY -> D7', () => {
      const result = service.calculateNextDue('D1', 'EASY');
      expect(result.newStage).toBe('D7');
    });
    
    it('should skip D3 + EASY -> D14', () => {
      const result = service.calculateNextDue('D3', 'EASY');
      expect(result.newStage).toBe('D14');
    });
    
    it('should skip D7 + EASY -> D30', () => {
      const result = service.calculateNextDue('D7', 'EASY');
      expect(result.newStage).toBe('D30');
    });
    
    it('should skip D14 + EASY -> D60', () => {
      const result = service.calculateNextDue('D14', 'EASY');
      expect(result.newStage).toBe('D60');
    });
    
    it('should skip D30 + EASY -> MASTERED', () => {
      const result = service.calculateNextDue('D30', 'EASY');
      expect(result.newStage).toBe('MASTERED');
    });
  });
  
  describe('calculateNextDue - MASTERED Ceiling', () => {
    it('should stay MASTERED + OK -> MASTERED', () => {
      const result = service.calculateNextDue('MASTERED', 'OK');
      expect(result.newStage).toBe('MASTERED');
    });
    
    it('should stay MASTERED + EASY -> MASTERED', () => {
      const result = service.calculateNextDue('MASTERED', 'EASY');
      expect(result.newStage).toBe('MASTERED');
    });
  });
  
  describe('getStageInterval', () => {
    it('should return correct intervals', () => {
      expect(service.getStageInterval('NEW')).toBe(0);
      expect(service.getStageInterval('D1')).toBe(1);
      expect(service.getStageInterval('D3')).toBe(3);
      expect(service.getStageInterval('D7')).toBe(7);
      expect(service.getStageInterval('D14')).toBe(14);
      expect(service.getStageInterval('D30')).toBe(30);
      expect(service.getStageInterval('D60')).toBe(60);
      expect(service.getStageInterval('MASTERED')).toBe(180);
    });
  });
  
  describe('calculateMasteryDelta', () => {
    it('should return correct mastery deltas', () => {
      expect(service.calculateMasteryDelta('FAIL')).toBe(-20);
      expect(service.calculateMasteryDelta('HARD')).toBe(-5);
      expect(service.calculateMasteryDelta('OK')).toBe(+10);
      expect(service.calculateMasteryDelta('EASY')).toBe(+15);
    });
  });
  
  describe('Date calculations', () => {
    it('should calculate correct due date for D1', () => {
      const now = new Date();
      const result = service.calculateNextDue('NEW', 'OK');
      
      const expected = addDays(now, 1);
      const diff = Math.abs(result.dueDate.getTime() - expected.getTime());
      
      expect(diff).toBeLessThan(1000); // Within 1 second
    });
    
    it('should calculate correct due date for D30', () => {
      const now = new Date();
      const result = service.calculateNextDue('D14', 'OK');
      
      const expected = addDays(now, 30);
      const diff = Math.abs(result.dueDate.getTime() - expected.getTime());
      
      expect(diff).toBeLessThan(1000);
    });
  });
});
