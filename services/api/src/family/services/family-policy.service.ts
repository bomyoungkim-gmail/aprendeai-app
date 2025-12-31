import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PromptLibraryService } from "../../prompts/prompt-library.service";
import { FamilyEventService } from "../../events/family-event.service";
import {
  CreateFamilyPolicyDto,
  UpdateFamilyPolicyDto,
} from "../dto/family-policy.dto";
import { FAMILY_CONFIG } from "../../config/family-classroom.config";
import { FamilyPolicyMapper } from "../../mappers/family-policy.mapper";
import * as crypto from "crypto";

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
    const policy = await this.prisma.family_policies.create({
      data: {
        id: crypto.randomUUID(),
        family_id: dto.familyId,
        learner_user_id: dto.learnerUserId,
        timebox_default_min:
          dto.timeboxDefaultMin ?? FAMILY_CONFIG.POLICY.DEFAULT_TIMEBOX_MIN,
        daily_min_minutes:
          dto.dailyMinMinutes ?? FAMILY_CONFIG.POLICY.DEFAULT_DAILY_MIN_MINUTES,
        daily_review_cap:
          dto.dailyReviewCap ?? FAMILY_CONFIG.POLICY.DEFAULT_DAILY_REVIEW_CAP,
        co_reading_days: dto.coReadingDays ?? [],
        co_reading_time: dto.coReadingTime,
        tool_words_gate_enabled: dto.toolWordsGateEnabled ?? true,
        privacy_mode:
          dto.privacyMode ?? FAMILY_CONFIG.POLICY.DEFAULT_PRIVACY_MODE,
        updated_at: new Date(),
      },
      include: {
        families: true,
        users: true,
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
            timeboxDefaultMin: policy.timebox_default_min,
            coReadingDays: policy.co_reading_days,
            coReadingTime: policy.co_reading_time || "",
            toolWordsGateEnabled: policy.tool_words_gate_enabled,
            dailyMinMinutes: policy.daily_min_minutes,
            dailyReviewCap: policy.daily_review_cap,
            privacyMode: policy.privacy_mode,
          },
        },
      },
    );

    return FamilyPolicyMapper.toDto(policy);
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
    const policy = await this.prisma.family_policies.findUnique({
      where: {
        family_id_learner_user_id: {
          family_id: familyId,
          learner_user_id: learnerUserId,
        },
      },
      include: {
        families: true,
        users: true,
      },
    });

    if (!policy) {
      throw new NotFoundException(
        `Policy not found for family ${familyId} and learner ${learnerUserId}`,
      );
    }

    return FamilyPolicyMapper.toDto(policy);
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
    const policy = await this.prisma.family_policies.update({
      where: {
        family_id_learner_user_id: {
          family_id: familyId,
          learner_user_id: learnerUserId,
        },
      },
      data: {
        timebox_default_min: dto.timeboxDefaultMin,
        daily_min_minutes: dto.dailyMinMinutes,
        daily_review_cap: dto.dailyReviewCap,
        co_reading_days: dto.coReadingDays,
        co_reading_time: dto.coReadingTime,
        tool_words_gate_enabled: dto.toolWordsGateEnabled,
        privacy_mode: dto.privacyMode,
        updated_at: new Date(),
      },
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
            timeboxDefaultMin: policy.timebox_default_min,
            coReadingDays: policy.co_reading_days,
            coReadingTime: policy.co_reading_time || "",
            toolWordsGateEnabled: policy.tool_words_gate_enabled,
            dailyMinMinutes: policy.daily_min_minutes,
            dailyReviewCap: policy.daily_review_cap,
            privacyMode: policy.privacy_mode,
          },
        },
      },
    );

    return FamilyPolicyMapper.toDto(policy);
  }

  /**
   * Gets confirmation prompt after policy creation
   *
   * @param policyId - Policy ID
   * @returns Canonical prompt with interpolated timebox value
   * @throws {NotFoundException} If policy doesn't exist
   */
  async getConfirmationPrompt(policyId: string) {
    const policy = await this.prisma.family_policies.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${policyId} not found`);
    }

    return this.promptLibrary.getPrompt("FAM_CONTRACT_CONFIRM", {
      MIN: policy.timebox_default_min,
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
