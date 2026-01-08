import { GraphDecayService } from '../decay/graph-decay.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Unit Tests for Graph Automation Core Logic
 * Tests decay formula, reinforcement logic, and configuration validation
 */
describe('Graph Automation - Core Logic', () => {
  let decayService: GraphDecayService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = new PrismaService();
    decayService = new GraphDecayService(prisma);
  });

  describe('Temporal Decay Formula', () => {
    it('should apply exponential decay correctly', () => {
      const currentConfidence = 0.8;
      const lastReinforcedAt = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days ago (1 half-life)

      const decayed = decayService.calculateDecay(currentConfidence, lastReinforcedAt);

      // After 1 half-life (14 days), should be ~0.4 (0.8 * 0.5)
      expect(decayed).toBeGreaterThan(0.35);
      expect(decayed).toBeLessThan(0.45);
    });

    it('should not decay below minimum threshold', () => {
      const currentConfidence = 0.3;
      const lastReinforcedAt = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

      const decayed = decayService.calculateDecay(currentConfidence, lastReinforcedAt);

      // Should not go below MIN_CONFIDENCE (0.2)
      expect(decayed).toBeGreaterThanOrEqual(0.2);
    });

    it('should not decay if never reinforced', () => {
      const currentConfidence = 0.7;
      const lastReinforcedAt = null;

      const decayed = decayService.calculateDecay(currentConfidence, lastReinforcedAt);

      // Should remain unchanged
      expect(decayed).toBe(currentConfidence);
    });

    it('should decay to half after one half-life period', () => {
      const currentConfidence = 1.0;
      const halfLifeDays = 14;
      const lastReinforcedAt = new Date(Date.now() - halfLifeDays * 24 * 60 * 60 * 1000);

      const decayed = decayService.calculateDecay(currentConfidence, lastReinforcedAt);

      // After 1 half-life, should be ~0.5
      expect(decayed).toBeGreaterThan(0.48);
      expect(decayed).toBeLessThan(0.52);
    });

    it('should decay to quarter after two half-lives', () => {
      const currentConfidence = 1.0;
      const halfLifeDays = 14;
      const lastReinforcedAt = new Date(Date.now() - 2 * halfLifeDays * 24 * 60 * 60 * 1000);

      const decayed = decayService.calculateDecay(currentConfidence, lastReinforcedAt);

      // After 2 half-lives, should be ~0.25
      expect(decayed).toBeGreaterThan(0.23);
      expect(decayed).toBeLessThan(0.27);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error if half-life is invalid', () => {
      process.env.GRAPH_DECAY_HALF_LIFE = '0';
      expect(() => new GraphDecayService(prisma)).toThrow('GRAPH_DECAY_HALF_LIFE must be greater than 0');
      delete process.env.GRAPH_DECAY_HALF_LIFE;
    });

    it('should throw error if min confidence is out of range', () => {
      process.env.GRAPH_MIN_CONFIDENCE = '1.5';
      expect(() => new GraphDecayService(prisma)).toThrow('GRAPH_MIN_CONFIDENCE must be between 0 and 1');
      delete process.env.GRAPH_MIN_CONFIDENCE;
    });
  });
});
