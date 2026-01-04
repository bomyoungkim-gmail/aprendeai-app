import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { DecisionModule } from '../src/decision/decision.module';
import { TelemetryModule } from '../src/telemetry/telemetry.module';

async function verify() {
  const prisma = new PrismaClient();
  
  const testData = {
    userId: 'user_v2_verify_' + Date.now(),
    sessionId: 'session_v2_verify',
    contentId: 'content_v2_verify',
    uiPolicyVersion: '1.0.0',
    signals: {
      explicitUserAction: 'USER_ASKS_ANALOGY',
      doubtsInWindow: 0,
      checkpointFailures: 0,
      flowState: 'FLOW',
      summaryQuality: 'OK',
    }
  };

  console.log('🚀 Starting E2E Verification for Decision Logs v2...');

  // Setup Nest Application Context for the test
  const moduleRef = await Test.createTestingModule({
    imports: [DecisionModule, TelemetryModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  console.log('📡 Sending POST /decision/evaluate...');
  
  // Use a hack to avoid supertest typing issues in this context
  const req: any = request;
  const response = await req(app.getHttpServer())
    .post('/decision/evaluate')
    .send(testData);

  if (response.status !== 200) {
    console.error('❌ Request failed:', response.status, response.body);
    process.exit(1);
  }

  console.log('✅ Response received:', JSON.stringify(response.body, null, 2));

  // Wait a moment for DB sync
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log('🔍 Checking database for the new log entry...');
  const log = await prisma.decision_logs.findFirst({
    where: { user_id: testData.userId },
    orderBy: { created_at: 'desc' },
  });

  if (!log) {
    console.error('❌ Log entry not found in database!');
    process.exit(1);
  }

  console.log('📊 Log Entry Details:');
  console.log(`- ID: ${log.id}`);
  console.log(`- Final Action: ${log.final_action}`);
  console.log(`- Candidate Action: ${log.candidate_action}`);
  console.log(`- Suppressed: ${log.suppressed}`);
  console.log(`- Suppress Reasons: ${JSON.stringify(log.suppress_reasons_json)}`);
  console.log(`- Channel Before: ${log.channel_before}`);
  console.log(`- Channel After: ${log.channel_after}`);
  console.log(`- Policy Snapshot: ${JSON.stringify(log.policy_snapshot_json)}`);

  let success = true;
  if (log.final_action === null) { console.error('❌ Missing final_action'); success = false; }
  if (log.channel_before === null) { console.error('❌ Missing channel_before'); success = false; }
  if (log.channel_after === null) { console.error('❌ Missing channel_after'); success = false; }

  if (!success) {
    process.exit(1);
  }

  console.log('🎉 E2E Verification Successful! v2 logs are fully populated.');

  await app.close();
  await prisma.$disconnect();
}

verify().catch(err => {
  console.error('💥 Verification crashed:', err);
  process.exit(1);
});
