import { Test, TestingModule } from '@nestjs/testing';
import { DecisionService } from './decision.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionModule } from '../decision.module';
import { TelemetryModule } from '../../telemetry/telemetry.module';

describe('Decision Logs v2 E2E Verification', () => {
  let service: DecisionService;
  let prisma: PrismaService;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [DecisionModule, TelemetryModule],
    }).compile();

    service = moduleFixture.get<DecisionService>(DecisionService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleFixture.close();
  });

  it('should produce fully populated v2 logs when evaluate logic is triggered', async () => {
    const testUserId = 'c8c01283-b539-4e21-b8b2-2158b5a016a0'; // Real user ID
    const testInput = {
      userId: testUserId,
      sessionId: 'session_v2_spec',
      contentId: 'af7c08f2-c5ef-4326-a843-074a3dfc480a', // Real content ID
      uiPolicyVersion: '1.0.0',
      signals: {
        explicitUserAction: 'USER_ASKS_ANALOGY' as const,
        doubtsInWindow: 0,
        checkpointFailures: 0,
        flowState: 'FLOW' as const,
        summaryQuality: 'OK' as const,
      },
    };

    console.log('📡 Triggering decision evaluation...');
    const result = await service.makeDecision(testInput);

    expect(result.action).toBeDefined();

    // Wait a moment for DB async logging (though DecisionService awaits it)
    // await new Promise(resolve => setTimeout(resolve, 500));

    console.log('🔍 Querying database for log entry...');
    const log = await prisma.decision_logs.findFirst({
      where: { user_id: testUserId },
      orderBy: { created_at: 'desc' },
    });

    expect(log).toBeDefined();
    console.log('📊 Log Entry V2 Fields:');
    console.log(`- Final Action: ${log?.final_action}`);
    console.log(`- Candidate Action: ${log?.candidate_action}`);
    console.log(`- Suppressed: ${log?.suppressed}`);
    console.log(`- Channel Before: ${log?.channel_before}`);
    console.log(`- Channel After: ${log?.channel_after}`);

    // Core validation of v2 fields
    expect(log?.final_action).toBe(result.action);
    expect(log?.candidate_action).toBeDefined(); // For explicit ask, it's usually same or similar
    expect(log?.suppressed).toBe(false);
    expect(log?.channel_before).toBeDefined();
    expect(log?.channel_after).toBe(result.channel);
    expect(log?.policy_snapshot_json).toBeDefined();
    expect(log?.suppress_reasons_json).toBeDefined();

    console.log('🎉 Verification Successful: v2 fields are correctly populated!');
  });
});
