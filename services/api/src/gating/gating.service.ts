import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetLayer } from '@prisma/client';

@Injectable()
export class GatingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Determine appropriate layer for user based on eligibility and fallback rules.
   * 
   * Logic:
   * 1. Check user eligibility (layer_eligibility table)
   * 2. If eligible for requested layer, use it
   * 3. If not eligible, check fallback rules
   * 4. Default to L1 if all else fails
   */
  async determineLayer(
    userId: string,
    contentId: string,
    requestedLayer?: AssetLayer
  ): Promise<AssetLayer> {
    // Get or create eligibility record
    const eligibility = await this.getOrCreateEligibility(userId);

    // If no specific layer requested, determine based on eligibility
    if (!requestedLayer) {
      if (eligibility.eligibleL3) return 'L3';
      if (eligibility.eligibleL2) return 'L2';
      return 'L1';
    }

    // If requested L1, always allowed
    if (requestedLayer === 'L1') {
      return 'L1';
    }

    // If requested L2, check eligibility
    if (requestedLayer === 'L2') {
      if (eligibility.eligibleL2) {
        return 'L2';
      }
      
      // Fallback: check if L3-eligible user can use L2
      if (eligibility.eligibleL3) {
        return 'L2'; // L3 users can always use L2
      }
      
      // Not eligible, fall back to L1
      return 'L1';
    }

    // If requested L3, check eligibility
    if (requestedLayer === 'L3') {
      if (eligibility.eligibleL3) {
        return 'L3';
      }
      
      // Not eligible for L3, check L2
      if (eligibility.eligibleL2) {
        return 'L2';
      }
      
      // Fall back to L1
      return 'L1';
    }

    // Default fallback
    return 'L1';
  }

  /**
   * Update user eligibility based on recent performance.
   * Should be called periodically or after session completion.
   */
  async updateEligibility(userId: string): Promise<void> {
    const eligibleL2 = await this.checkL2Eligibility(userId);
    const eligibleL3 = await this.checkL3Eligibility(userId);

    const reason = {
      l2: eligibleL2 ? 'Meets L2 criteria' : 'Does not meet L2 criteria',
      l3: eligibleL3 ? 'Meets L3 criteria' : 'Does not meet L3 criteria',
      updatedAt: new Date().toISOString()
    };

    await this.prisma.layerEligibility.upsert({
      where: { userId },
      create: {
        userId,
        eligibleL2,
        eligibleL3,
        reasonJson: reason,
      },
      update: {
        eligibleL2,
        eligibleL3,
        reasonJson: reason,
        updatedAt: new Date(),
      }
    });
  }

  /**
   * Check if user is eligible for L2 (Standard complexity).
   * 
   * Criteria:
   * - Completed at least 3 sessions
   * - Average comprehension score >= 60
   * - Average frustration index <= 50
   */
  async checkL2Eligibility(userId: string): Promise<boolean> {
    const recentSessions = await this.prisma.readingSession.findMany({
      where: {
        userId,
        phase: 'FINISHED',
      },
      include: {
        outcome: true,
      },
      orderBy: {
        finishedAt: 'desc'
      },
      take: 10 // Look at last 10 sessions
    });

    // Need at least 3 completed sessions
    if (recentSessions.length < 3) {
      return false;
    }

    // Calculate average comprehension and frustration
    const sessionsWithOutcomes = recentSessions.filter(s => s.outcome);
    
    if (sessionsWithOutcomes.length < 3) {
      return false; // Not enough data
    }

    const avgComprehension = sessionsWithOutcomes.reduce(
      (sum, s) => sum + (s.outcome?.comprehensionScore || 0), 0
    ) / sessionsWithOutcomes.length;

    const avgFrustration = sessionsWithOutcomes.reduce(
      (sum, s) => sum + (s.outcome?.frustrationIndex || 0), 0
    ) / sessionsWithOutcomes.length;

    // L2 eligibility criteria
    return avgComprehension >= 60 && avgFrustration <= 50;
  }

  /**
   * Check if user is eligible for L3 (Advanced complexity).
   * 
   * Criteria:
   * - Completed at least 5 sessions
   * - Average comprehension score >= 75
   * - Average production score >= 70
   * - Average frustration index <= 40
   * - Currently eligible for L2
   */
  async checkL3Eligibility(userId: string): Promise<boolean> {
    const recentSessions = await this.prisma.readingSession.findMany({
      where: {
        userId,
        phase: 'FINISHED',
      },
      include: {
        outcome: true,
      },
      orderBy: {
        finishedAt: 'desc'
      },
      take: 10
    });

    // Need at least 5 completed sessions
    if (recentSessions.length < 5) {
      return false;
    }

    const sessionsWithOutcomes = recentSessions.filter(s => s.outcome);
    
    if (sessionsWithOutcomes.length < 5) {
      return false;
    }

    const avgComprehension = sessionsWithOutcomes.reduce(
      (sum, s) => sum + (s.outcome?.comprehensionScore || 0), 0
    ) / sessionsWithOutcomes.length;

    const avgProduction = sessionsWithOutcomes.reduce(
      (sum, s) => sum + (s.outcome?.productionScore || 0), 0
    ) / sessionsWithOutcomes.length;

    const avgFrustration = sessionsWithOutcomes.reduce(
      (sum, s) => sum + (s.outcome?.frustrationIndex || 0), 0
    ) / sessionsWithOutcomes.length;

    // L3 eligibility criteria (stricter than L2)
    return (
      avgComprehension >= 75 &&
      avgProduction >= 70 &&
      avgFrustration <= 40
    );
  }

  /**
   * Get or create eligibility record for user.
   * Defaults to L1 only (not eligible for L2/L3).
   */
  private async getOrCreateEligibility(userId: string) {
    let eligibility = await this.prisma.layerEligibility.findUnique({
      where: { userId }
    });

    if (!eligibility) {
      // Create default eligibility (L1 only)
      eligibility = await this.prisma.layerEligibility.create({
        data: {
          userId,
          eligibleL2: false,
          eligibleL3: false,
          reasonJson: {
            message: 'New user - default to L1',
            createdAt: new Date().toISOString()
          }
        }
      });
    }

    return eligibility;
  }

  /**
   * Get current eligibility status for a user.
   */
  async getEligibility(userId: string) {
    return this.getOrCreateEligibility(userId);
  }
}
