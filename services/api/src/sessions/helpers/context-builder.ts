import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../../gamification/gamification.service';
import { PromptContext } from '../../prompts/types/prompt-context';
import { parseDecisionPolicy } from '../../policies/decision-policy.parse';
import { mergeDecisionPolicies } from '../../policies/decision-policy.merge';
import { DecisionPolicyV1 } from '../../policies/decision-policy.schema';
import { ContentModeHelper } from '../../contents/helpers/content-mode.helper';
import { ScaffoldingInitializerService } from '../../decision/application/scaffolding-initializer.service'; // SCRIPT 03

/**
 * Dependencies required for building session context
 */
export interface ContextBuilderDeps {
  prisma: PrismaService;
  gamificationService: GamificationService;
  scaffoldingInitializer: ScaffoldingInitializerService; // SCRIPT 03
}

/**
 * Build comprehensive prompt context from session data
 * Pure helper function following best practices (no DI overhead)
 * 
 * @param sessionId - Reading session ID
 * @param userId - User ID
 * @param contentId - Content ID
 * @param deps - Service dependencies (Prisma, Gamification)
 * @returns PromptContext with all available variables populated
 */
// Simple in-memory cache
const contextCache = new Map<string, { data: PromptContext & { decision_policy: DecisionPolicyV1 }; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function buildSessionContext(
  sessionId: string,
  userId: string,
  contentId: string,
  deps: ContextBuilderDeps,
  uiMode?: string, // Script 02 - P2: UI override for ContentMode
): Promise<PromptContext & { decision_policy: DecisionPolicyV1 }> {
  const cacheKey = `${sessionId}:${userId}`;
  const now = Date.now();
  
  // Check cache
  const cached = contextCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const { prisma, gamificationService, scaffoldingInitializer } = deps; // SCRIPT 03

  try {
    // Fetch all data in parallel for performance
    const [
      user,
      session,
      content,
      dashboard,
      vocabCount,
      nextReview,
      institutionPolicy,
      familyPolicy,
      learnerProfile, // SCRIPT 03: For scaffolding initialization
    ] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      prisma.reading_sessions.findUnique({
        where: { id: sessionId },
        select: { started_at: true, finished_at: true },
      }),
      prisma.contents.findUnique({
        where: { id: contentId },
        select: {
          title: true,
          type: true,
          mode: true,
          mode_source: true,
          mode_set_by: true,
          metadata: true,
          raw_text: true,
        },
      }),
      gamificationService.getDashboard(userId).catch(() => null), // Fallback on error
      prisma.vocab_items.count({
        where: { user_id: userId },
      }).catch(() => 0),
      prisma.vocab_items.findFirst({
        where: {
          user_id: userId,
          due_at: { gt: new Date() }, // Only future reviews
        },
        orderBy: { due_at: 'asc' },
        select: { due_at: true },
      }).catch(() => null),
      // Fetch institution policy (if user has last_institution_id)
      prisma.users
        .findUnique({
          where: { id: userId },
          select: { last_institution_id: true },
        })
        .then((u) =>
          u?.last_institution_id
            ? prisma.institution_policies.findFirst({
                where: { institution_id: u.last_institution_id },
                select: { decision_policy_json: true },
              })
            : null,
        )
        .catch(() => null),
      // Fetch family policy (if user is in a family)
      prisma.family_policies
        .findFirst({
          where: { learner_user_id: userId },
          select: { decision_policy_json: true },
        })
        .catch(() => null),
      // SCRIPT 03: Fetch learner profile for scaffolding initialization
      prisma.learner_profiles
        .findUnique({
          where: { user_id: userId },
          select: {
            mastery_state_json: true,
            scaffolding_state_json: true,
            created_at: true,
          },
        })
        .catch(() => null),
    ]);

    // Calculate session metrics
    const sessionMinutes = calculateSessionDuration(session);
    const wordsMarked = await countMarkedWords(sessionId, prisma);
    const daysUntilReview = calculateDaysUntil(nextReview?.due_at);

    // Merge decision policies (GLOBAL < INSTITUTION < FAMILY)
    const globalDefaults = parseDecisionPolicy({}, 'GLOBAL');
    const instPolicy = parseDecisionPolicy(
      institutionPolicy?.decision_policy_json,
      'INSTITUTION',
    );
    const famPolicy = parseDecisionPolicy(
      familyPolicy?.decision_policy_json,
      'FAMILY',
    );
    const decision_policy = mergeDecisionPolicies(
      globalDefaults,
      instPolicy,
      famPolicy,
    );

    // Resolve content mode (Script 02: RB-CONTENT-MODE)
    // P2: uiMode from request params takes precedence over DB mode
    const modeResolution = ContentModeHelper.resolveMode(
      {
        mode: content?.mode,
        modeSource: content?.mode_source,
        modeSetBy: content?.mode_set_by,
        type: content?.type,
        metadata: content?.metadata,
        rawText: content?.raw_text,
      },
      uiMode || null, // Use provided uiMode or null
      userId,
    );

    // Persist mode if it was inferred heuristically
    if (modeResolution.isHeuristic && content) {
      // Fire-and-forget async update (don't block context building)
      prisma.contents
        .update({
          where: { id: contentId },
          data: {
            mode: modeResolution.mode,
            mode_source: modeResolution.source,
            mode_set_by: modeResolution.setBy,
            mode_set_at: new Date(),
          },
        })
        .catch((err) => console.error('Failed to persist content mode:', err));
    }

    // ========================================================================
    // SCRIPT 03: Mode-Aware Scaffolding Initialization
    // ========================================================================
    
    // Calculate learner profile metrics for scaffolding
    const masteryStateJson = learnerProfile?.mastery_state_json;
    const scaffoldingStateJson = learnerProfile?.scaffolding_state_json;
    const isNewUser = !learnerProfile || !learnerProfile.created_at || 
                      (new Date().getTime() - new Date(learnerProfile.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000; // < 7 days
    
    const avgMastery = calculateAvgMastery(masteryStateJson);
    const recentPerformance = getRecentPerformance(masteryStateJson);
    
    // Extract policy override (GAP 6)
    // Use mode-specific default level from policy if available
    const policyOverride = decision_policy?.scaffolding?.defaultLevelByMode?.[modeResolution.mode];
    
    // Initialize scaffolding level if not already set
    let currentScaffoldingLevel = scaffoldingStateJson?.currentLevel;
    
    if (currentScaffoldingLevel === undefined || currentScaffoldingLevel === null) {
      // First time or no scaffolding state - initialize based on mode
      currentScaffoldingLevel = scaffoldingInitializer.getInitialLevel({
        mode: modeResolution.mode,
        learnerProfile: {
          isNewUser,
          avgMastery,
          recentPerformance,
        },
        policyOverride,
      });
      
      // Persist initial scaffolding state (fire-and-forget)
      if (learnerProfile) {
        prisma.learner_profiles
          .update({
            where: { user_id: userId },
            data: {
              scaffolding_state_json: {
                currentLevel: currentScaffoldingLevel,
                lastLevelChangeAt: new Date(),
                fadingMetrics: {
                  consecutiveSuccesses: 0,
                  interventionDismissalRate: 0,
                },
              },
            },
          })
          .catch((err) => console.error('Failed to persist initial scaffolding state:', err));
      }
    }

    // Build context with safe fallbacks
    const context: PromptContext = {
      // User
      LEARNER: user?.name || 'você',
      
      // Gamification
      XP: dashboard?.totalXp ?? 0,
      XP_TODAY: dashboard?.dailyActivity?.xp ?? 0,
      STREAK: dashboard?.currentStreak ?? 0,
      
      // Session
      MIN: sessionMinutes,
      WORDS_MARKED: wordsMarked,
      
      // Content
      TITLE: content?.title || 'este conteúdo',
      content_mode: modeResolution.mode,
      
      // SRS
      VOCAB_COUNT: vocabCount,
      DAYS: daysUntilReview,
      
      // Not implemented in MVP (will be undefined)
      LEVEL: undefined,
      COMP: undefined,
      PROGRESS: undefined,
    };

    // Save to cache
    contextCache.set(cacheKey, {
      data: { ...context, decision_policy } as any,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return { ...context, decision_policy } as any;
  } catch (error) {
    // Fallback to minimal context on catastrophic failure
    console.error('Failed to build session context:', error);
    return {
      LEARNER: 'você',
      XP: 0,
      XP_TODAY: 0,
      STREAK: 0,
      MIN: 0,
      WORDS_MARKED: 0,
      VOCAB_COUNT: 0,
      TITLE: 'este conteúdo',
      decision_policy: parseDecisionPolicy({}, 'GLOBAL'),
    } as any;
  }
}

/**
 * Calculate session duration in minutes
 * @param session - Session with started_at and optional finished_at
 * @returns Duration in minutes (0 if no start time)
 */
function calculateSessionDuration(session: any): number {
  if (!session?.started_at) return 0;
  
  const endTime = session.finished_at ? new Date(session.finished_at) : new Date();
  const startTime = new Date(session.started_at);
  
  const durationMs = endTime.getTime() - startTime.getTime();
  return Math.floor(durationMs / (1000 * 60));
}

/**
 * Count words marked as unknown in this session
 * @param sessionId - Session ID
 * @param prisma - Prisma service instance
 * @returns Count of marked words
 */
async function countMarkedWords(sessionId: string, prisma: PrismaService): Promise<number> {
  try {
    const count = await prisma.session_events.count({
      where: {
        reading_session_id: sessionId,
        event_type: 'MARK_UNKNOWN_WORD',
      },
    });
    return count;
  } catch (error) {
    console.warn('Failed to count marked words:', error);
    return 0;
  }
}

/**
 * Calculate days until a target date
 * @param targetDate - Future date
 * @returns Days remaining (rounded up), or undefined if no date
 */
function calculateDaysUntil(targetDate?: Date): number | undefined {
  if (!targetDate) return undefined;
  
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

// ============================================================================
// SCRIPT 03: Scaffolding Initialization Helpers
// ============================================================================

/**
 * Calculate average mastery across all domains
 * 
 * @param masteryStateJson - Mastery state from learner_profiles.mastery_state_json
 * @returns Average mastery (0.0-1.0), or 0 if no data
 */
function calculateAvgMastery(masteryStateJson: any): number {
  if (!masteryStateJson?.domains) return 0;
  
  const domains = Object.values(masteryStateJson.domains) as any[];
  if (domains.length === 0) return 0;
  
  const totalMastery = domains.reduce((sum, domain) => sum + (domain.mastery || 0), 0);
  return totalMastery / domains.length;
}

/**
 * Calculate recent performance metric
 * 
 * For now, uses avgMastery as a proxy.
 * TODO: In future, could analyze recent session outcomes or quiz scores.
 * 
 * @param masteryStateJson - Mastery state from learner_profiles
 * @returns Recent performance (0.0-1.0)
 */
function getRecentPerformance(masteryStateJson: any): number {
  // Simple implementation: use avgMastery as proxy
  // Future enhancement: analyze session_outcomes from last N sessions
  return calculateAvgMastery(masteryStateJson);
}

