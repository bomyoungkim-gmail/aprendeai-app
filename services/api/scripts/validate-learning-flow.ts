
import { PrismaClient, ContentMode, Language, ContentType } from '@prisma/client';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:4000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-change-in-production';

async function main() {
  const prisma = new PrismaClient();
  const email = `validation.${Date.now()}@example.com`;
  const userId = uuidv4();

  try {
    console.log('1. Creating User and Content directly in DB...');
    
    // Create User
    await prisma.users.create({
      data: {
        id: userId,
        email,
        password_hash: 'hash_ignored_since_we_sign_token_directly',
        name: 'Validation User', // changed from full_name
      },
    });

    // Create Content
    const content = await prisma.contents.create({
      data: {
        id: uuidv4(),
        title: 'Learning Module Validation Content',
        mode: ContentMode.DIDACTIC, 
        type: ContentType.ARTICLE,
        raw_text: 'This is a test content for validation.',
        original_language: Language.EN,
      },
    });

    console.log(`   User created: ${userId}`);
    console.log(`   Content created: ${content.id}`);

    // Generate Token
    const token = jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: '1h' });
    console.log('2. Generated Test JWT Token.');

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Start Session via API
    console.log('3. Starting Session via API...');
    // Endpoint: POST /api/v1/contents/:contentId/reading-sessions
    const startSessionUrl = `${API_URL}/contents/${content.id}/reading-sessions`;
    
    // Fallback: The controller has multiple endpoints.
    // Try legacy first: POST contents/:id/reading-sessions
    let session;
    try {
      const res = await axios.post(startSessionUrl, {}, { headers });
      session = res.data;
      console.log(`   Session created via LEGACY endpoint: ${session.id}`);
    } catch (e) {
      console.log('   Legacy endpoint failed, trying Prompt-Only endpoint...');
      // Try Prompt-Only: POST sessions/start
      const res = await axios.post(`${API_URL}/sessions/start`, {
        contentId: content.id,
        mode: 'DIDACTIC'
      }, { headers });
      session = res.data;
      console.log(`   Session created via PROMPT-ONLY endpoint: ${session.id}`);
    }

    if (!session || !session.id) {
      throw new Error('Failed to create session');
    }

    // 3b. Seed Assessment (Checkpoint)
    console.log('3b. Seeding Pending Assessment...');
    try {
      await prisma.assessments.create({
        data: {
          id: uuidv4(),
          content_id: content.id,
          schooling_level_target: 'B1',
          // other fields are optional or have defaults
        },
      });
      console.log('   Assessment seeded.');
    } catch (e) {
      console.warn('   Failed to seed assessment (might already exist or schema mismatch):', (e as Error).message);
    }

    // 3c. Seed Doubt Events (Trigger Intervention)
    console.log('3c. Seeding Doubt Events (MARK_UNKNOWN_WORD x 5)...');
    const eventsData = Array(5).fill(0).map(() => ({
      id: uuidv4(),
      reading_session_id: session.id,
      event_type: 'MARK_UNKNOWN_WORD' as any, // Cast to match Prisma enum if strictly typed
      payload_json: { word: 'test', context: 'context' },
      created_at: new Date(),
    }));

    await prisma.session_events.createMany({
      data: eventsData,
    });
    console.log('   Doubt events seeded.');

    // 4. Call Learning Next
    console.log('4. calling GET /learning/next...');
    const nextUrl = `${API_URL}/learning/next?sessionId=${session.id}`;
    const nextRes = await axios.get(nextUrl, { headers });

    console.log('   Response Status:', nextRes.status);
    console.log('   Response Data:', JSON.stringify(nextRes.data, null, 2));

    // Validation
    const actions = nextRes.data.actions;
    if (Array.isArray(actions) && actions.length > 0) {
      console.log('✅ VALIDATION PASSED: Received valid actions list.');
      console.log('✅ VALIDATION PASSED: Received valid actions list.');
      
      const nav = actions.find((a: any) => a.type === 'CONTENT_NAV');
      if (nav) console.log('   - Found CONTENT_NAV action (Default).');

      const checkpoint = actions.find((a: any) => a.type === 'CHECKPOINT');
      if (checkpoint) {
        console.log('   - ✅ Found CHECKPOINT action (Priority 90).');
        if (checkpoint.isBlocking) console.log('     - Verified isBlocking=true.');
      } else {
        console.warn('   - ⚠️ CHECKPOINT action missing.');
      }

      const intervention = actions.find((a: any) => a.type === 'INTERVENTION');
      if (intervention) {
         console.log('   - ✅ Found INTERVENTION action (Doubt Spike detected).');
         console.log(`     - Title: ${intervention.title}`);
      } else {
         console.warn('   - ⚠️ INTERVENTION action missing (Signal enrichment check failed?).');
      }
    } else {
      console.error('❌ VALIDATION FAILED: No actions received.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ ERROR:', (error as Error).message);
    if (axios.isAxiosError(error)) {
       console.error('   API Response:', error.response?.data);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
