import { PrismaClient, DecisionAction } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillDecisionLogs() {
  console.log('🔄 Starting Decision Logs v2 Backfill...');

  // 1. Count logs needing migration
  const count = await prisma.decision_logs.count({
    where: {
      final_action: null,
    },
  });

  console.log(`📊 Found ${count} legacy logs to migrate.`);

  if (count === 0) {
    console.log('✅ No logs to migrate.');
    return;
  }

  // 2. Fetch logs in batches to avoid memory issues
  const batchSize = 100;
  let processed = 0;
  let updated = 0;
  let skipped = 0;

  while (processed < count) {
    const logs = await prisma.decision_logs.findMany({
      where: {
        final_action: null,
      },
      take: batchSize,
    });

    if (logs.length === 0) break;

    for (const log of logs) {
      // Validate action matches enum
      const actionString = log.output_action;
      
      // Handle potential legacy mismatch (though unlikely if service was typed)
      // If action is not in enum, we might need to map it or skip.
      // For now, valid actions in v2 are: NO_OP, ASK_PROMPT, ASSIGN_MISSION, GUIDED_SYNTHESIS, CALL_AGENT, CALL_AI_SERVICE_EXTRACT
      // Legacy might have had 'SHOW_HINT' which we replaced in code with 'ASK_PROMPT'.
      // If DB has 'SHOW_HINT', we should map it.

      let finalAction: DecisionAction | null = null;

      if (Object.values(DecisionAction).includes(actionString as DecisionAction)) {
        finalAction = actionString as DecisionAction;
      } else if (actionString === 'SHOW_HINT') {
         // Legacy mapping if needed
         finalAction = 'ASK_PROMPT'; 
      } else {
        console.warn(`⚠️ Log ${log.id}: Unknown action "${actionString}". Skipping.`);
        skipped++;
        continue;
      }

      await prisma.decision_logs.update({
        where: { id: log.id },
        data: {
          final_action: finalAction,
          candidate_action: null, // Legacy didn't track candidate separately
          suppressed: false, // Legacy didn't track suppression (assumed enforced)
          suppress_reasons_json: [],
          channel_before: log.channel, // Assume no degradation
          channel_after: log.channel,
          budget_remaining_tokens: null, // Not tracked in legacy
          cooldown_until: null,
          policy_snapshot_json: {},
        },
      });

      updated++;
    }

    processed += logs.length;
    console.log(`⏳ Processed ${processed}/${count}...`);
  }

  console.log('✅ Backfill completed!');
  console.log(`📈 Summary: ${updated} updated, ${skipped} skipped.`);
}

backfillDecisionLogs()
  .catch((error) => {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
