import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { FamilyEventService } from "../../events/family-event.service";
import {
  CreateFamilyPolicyDto,
  UpdateFamilyPolicyDto,
} from "../dto/family-policy.dto";
import { FAMILY_CONFIG } from "../../config/family-classroom.config";

@Injectable()
export class FamilyPolicyService {
  constructor(
    private prisma: PrismaService,
    private promptLibrary: PromptLibraryService,
    private familyEventService: FamilyEventService,
  ) {}

  /**
   * Creates a new family policy with default values
   *
   * @param dto - Policy creation data (familyId, learnerUserId, optional settings)
   * @returns Created policy with family and learner relations
   * @throws {Error} If family or learner doesn't exist
   *
   * @example
   * ```typescript
   * const policy = await service.create({
   *   familyId: 'fam_123',
   *   learnerUserId: 'user_456',
   *   timeboxDefaultMin: 20,
   *   privacyMode: 'AGGREGATED_ONLY'
   * });
   * ```
   */
  async create(dto: CreateFamilyPolicyDto) {
    const policy = await this.prisma.familyPolicy.create({
      data: {
        familyId: dto.familyId,
        learnerUserId: dto.learnerUserId,
        timeboxDefaultMin:
          dto.timeboxDefaultMin ?? FAMILY_CONFIG.POLICY.DEFAULT_TIMEBOX_MIN,
        dailyMinMinutes:
          dto.dailyMinMinutes ?? FAMILY_CONFIG.POLICY.DEFAULT_DAILY_MIN_MINUTES,
        dailyReviewCap:
          dto.dailyReviewCap ?? FAMILY_CONFIG.POLICY.DEFAULT_DAILY_REVIEW_CAP,
        coReadingDays: dto.coReadingDays ?? [],
        coReadingTime: dto.coReadingTime,
        toolWordsGateEnabled: dto.toolWordsGateEnabled ?? true,
        privacyMode:
          dto.privacyMode ?? FAMILY_CONFIG.POLICY.DEFAULT_PRIVACY_MODE,
      },
      include: {
        family: true,
        learner: true,
      },
    });

    // Log FAMILY_POLICY_SET event
    await this.familyEventService.logPolicySet(
      `policy_${policy.id}`,
      dto.learnerUserId,
      {
        domain: "FAMILY",
        type: "FAMILY_POLICY_SET",
        data: {
          householdId: dto.familyId,
          learnerUserId: dto.learnerUserId,
          policy: {
            timeboxDefaultMin: policy.timeboxDefaultMin,
            coReadingDays: policy.coReadingDays,
            coReadingTime: policy.coReadingTime || "",
            toolWordsGateEnabled: policy.toolWordsGateEnabled,
            dailyMinMinutes: policy.dailyMinMinutes,
            dailyReviewCap: policy.dailyReviewCap,
            privacyMode: policy.privacyMode,
          },
        },
      },
    );

    return policy;
  }

  /**
   * Retrieves policy for a specific learner in a family
   *
   * @param familyId - Family ID
   * @param learnerUserId - Learner's user ID
   * @returns Policy with relations
   * @throws {NotFoundException} If policy doesn't exist for this family/learner combination
   */
  async getByFamilyAndLearner(familyId: string, learnerUserId: string) {
    const policy = await this.prisma.familyPolicy.findUnique({
      where: {
        familyId_learnerUserId: {
          familyId,
          learnerUserId,
        },
      },
      include: {
        family: true,
        learner: true,
      },
    });

    if (!policy) {
      throw new NotFoundException(
        `Policy not found for family ${familyId} and learner ${learnerUserId}`,
      );
    }

    return policy;
  }

  /**
   * Updates an existing family policy
   *
   * @param familyId - Family ID
   * @param learnerUserId - Learner's user ID
   * @param dto - Fields to update
   * @returns Updated policy
   * @throws {Error} If policy doesn't exist
   *
   * Logs FAMILY_POLICY_SET event after successful update
   */
  async update(
    familyId: string,
    learnerUserId: string,
    dto: UpdateFamilyPolicyDto,
  ) {
    const policy = await this.prisma.familyPolicy.update({
      where: {
        familyId_learnerUserId: {
          familyId,
          learnerUserId,
        },
      },
      data: dto,
    });

    // Log update event
    await this.familyEventService.logPolicySet(
      `policy_${policy.id}`,
      learnerUserId,
      {
        domain: "FAMILY",
        type: "FAMILY_POLICY_SET",
        data: {
          householdId: familyId,
          learnerUserId,
          policy: {
            timeboxDefaultMin: policy.timeboxDefaultMin,
            coReadingDays: policy.coReadingDays,
            coReadingTime: policy.coReadingTime || "",
            toolWordsGateEnabled: policy.toolWordsGateEnabled,
            dailyMinMinutes: policy.dailyMinMinutes,
            dailyReviewCap: policy.dailyReviewCap,
            privacyMode: policy.privacyMode,
          },
        },
      },
    );

    return policy;
  }

  /**
   * Gets confirmation prompt after policy creation
   *
   * @param policyId - Policy ID
   * @returns Canonical prompt with interpolated timebox value
   * @throws {NotFoundException} If policy doesn't exist
   */
  async getConfirmationPrompt(policyId: string) {
    const policy = await this.prisma.familyPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${policyId} not found`);
    }

    return this.promptLibrary.getPrompt("FAM_CONTRACT_CONFIRM", {
      MIN: policy.timeboxDefaultMin,
    });
  }

  /**
   * Get onboarding prompt for family mode
   */
  getOnboardingPrompt() {
    return this.promptLibrary.getPrompt("FAM_ONBOARD_START");
  }

  /**
   * Get privacy mode selection prompt
   */
  getPrivacyModePrompt() {
    return this.promptLibrary.getPrompt("FAM_PRIVACY_MODE");
  }
}
